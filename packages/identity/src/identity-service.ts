import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { addMember, defaultWorkspaceId, ensureDefaultWorkspaceMigration, listMembers } from "@phoenix-ai/workspace";
import { createTraceId, getTraceId } from "@phoenix-ai/observability";
import { ensureIdentityStorage, listJsonFiles, readJson, usersRoot, writeJson } from "./identity-repository.ts";
import { hashPassword, verifyPassword } from "./password-service.ts";
import { buildSessionCookie, clearSessionCookie, createSession, listUserSessions, revokeSession, validateSession } from "./session-service.ts";
import type { IdentitySession, IdentityUser } from "./types.ts";

const now = () => new Date().toISOString();

export async function registerLocalUser(input: unknown): Promise<{ user: IdentityUser; session?: IdentitySession; setCookie?: string }> {
  if ((process.env.PHOENIX_AUTH_REGISTRATION_ENABLED ?? "false") !== "true") {
    throw new Error("Registration is disabled.");
  }
  const payload = validateRegisterInput(input);
  const existing = await findUserByEmail(payload.email);
  if (existing) throw new Error("User already exists.");
  const user = await createLocalUser(payload);
  await auditIdentity("identity.user.created", { userId: user.id, result: "success" });
  return { user: publicUser(user) };
}

export async function loginLocalUser(input: unknown, metadata: { ip?: string; userAgent?: string } = {}): Promise<{ user: IdentityUser; session: IdentitySession; setCookie: string }> {
  const payload = validateLoginInput(input);
  const user = await findUserByEmail(payload.email);
  if (!user || !user.password_hash) {
    await auditIdentity("identity.login.failed", { userId: user?.id ?? null, result: "failure", reasonCode: "invalid_credentials" });
    throw new Error("Invalid credentials.");
  }
  if (user.status !== "active") throw new Error("User is not active.");
  if (user.locked_until && Date.parse(user.locked_until) > Date.now()) throw new Error("Account is temporarily locked.");
  const ok = await verifyPassword(payload.password, user.password_hash);
  if (!ok) {
    user.failed_attempts += 1;
    if (user.failed_attempts >= Number(process.env.PHOENIX_AUTH_MAX_FAILED_ATTEMPTS ?? 5)) {
      user.locked_until = new Date(Date.now() + Number(process.env.PHOENIX_AUTH_LOCK_MINUTES ?? 15) * 60 * 1000).toISOString();
    }
    await saveUser(user);
    await auditIdentity("identity.login.failed", { userId: user.id, result: "failure", reasonCode: "invalid_credentials" });
    throw new Error("Invalid credentials.");
  }
  user.failed_attempts = 0;
  user.locked_until = null;
  user.last_login_at = now();
  user.updated_at = now();
  await saveUser(user);
  await ensureDefaultMembership(user);
  const session = await createSession(user.id, metadata);
  await auditIdentity("identity.login.succeeded", { userId: user.id, sessionId: session.id, result: "success" });
  return { user: publicUser(user), session, setCookie: buildSessionCookie(session.id) };
}

export async function logoutSession(sessionId: string): Promise<{ setCookie: string }> {
  await revokeSession(sessionId);
  await auditIdentity("identity.logout", { sessionId, result: "success" });
  return { setCookie: clearSessionCookie() };
}

export async function getCurrentUser(sessionId: string): Promise<{ user: IdentityUser; session: IdentitySession } | null> {
  const session = await validateSession(sessionId);
  if (!session) return null;
  const user = await getUser(session.user_id);
  if (!user || user.status !== "active") return null;
  return { user: publicUser(user), session };
}

export async function getUser(userId: string): Promise<IdentityUser | null> {
  return readJson<IdentityUser | null>(userPath(userId), null);
}

export async function listUsers(): Promise<IdentityUser[]> {
  await ensureIdentityStorage();
  const users = await listJsonFiles<IdentityUser>(usersRoot());
  return users.filter(Boolean).map(publicUser);
}

export async function updateUser(userId: string, input: unknown): Promise<IdentityUser> {
  const user = await requireUser(userId);
  const payload = input && typeof input === "object" ? input as { name?: unknown; status?: unknown } : {};
  if (typeof payload.name === "string" && payload.name.trim()) user.name = payload.name.trim();
  if (payload.status === "active" || payload.status === "disabled" || payload.status === "locked") user.status = payload.status;
  user.updated_at = now();
  await saveUser(user);
  return publicUser(user);
}

export async function setUserStatus(userId: string, status: "active" | "disabled"): Promise<IdentityUser> {
  const user = await requireUser(userId);
  user.status = status;
  user.updated_at = now();
  await saveUser(user);
  if (status === "disabled") {
    for (const session of await listUserSessions(userId)) await revokeSession(session.id);
  }
  return publicUser(user);
}

export async function changePassword(sessionId: string, input: unknown): Promise<void> {
  const current = await getCurrentUser(sessionId);
  if (!current) throw new Error("Session not found.");
  const payload = input as { current_password?: unknown; new_password?: unknown };
  if (typeof payload.current_password !== "string" || typeof payload.new_password !== "string") throw new Error("Invalid password payload.");
  const user = await requireUser(current.user.id);
  if (!user.password_hash || !(await verifyPassword(payload.current_password, user.password_hash))) throw new Error("Invalid credentials.");
  user.password_hash = await hashPassword(payload.new_password);
  user.password_changed_at = now();
  user.updated_at = now();
  await saveUser(user);
  await auditIdentity("identity.password.changed", { userId: user.id, sessionId, result: "success" });
}

export async function requestPasswordReset(input: unknown): Promise<{ status: "ok"; message: string }> {
  const email = typeof (input as { email?: unknown })?.email === "string" ? String((input as { email: string }).email).toLowerCase().trim() : "";
  const user = email ? await findUserByEmail(email) : null;
  await auditIdentity("identity.password.reset.requested", { userId: user?.id ?? null, result: "info" });
  return { status: "ok", message: "Se a conta existir, as instrucoes serao enviadas." };
}

export async function listSessions(sessionId: string): Promise<IdentitySession[]> {
  const current = await getCurrentUser(sessionId);
  if (!current) throw new Error("Session not found.");
  return listUserSessions(current.user.id);
}

export async function revokeUserSession(currentSessionId: string, sessionId: string): Promise<void> {
  const current = await getCurrentUser(currentSessionId);
  if (!current) throw new Error("Session not found.");
  const sessions = await listUserSessions(current.user.id);
  if (!sessions.some((session) => session.id === sessionId)) throw new Error("Session not found.");
  await revokeSession(sessionId);
  await auditIdentity("identity.session.revoked", { userId: current.user.id, sessionId, result: "success" });
}

export async function createLocalUser(input: { email: string; name: string; password: string; email_verified?: boolean }): Promise<IdentityUser> {
  await ensureIdentityStorage();
  const user: IdentityUser = {
    id: `usr_${randomUUID()}`,
    email: input.email.toLowerCase().trim(),
    name: input.name.trim(),
    status: "active",
    email_verified: input.email_verified ?? false,
    identities: [{ provider: "local", subject: input.email.toLowerCase().trim() }],
    password_hash: await hashPassword(input.password),
    failed_attempts: 0,
    locked_until: null,
    password_changed_at: now(),
    created_at: now(),
    updated_at: now(),
    last_login_at: null
  };
  await saveUser(user);
  return user;
}

export async function findUserByEmail(email: string): Promise<IdentityUser | null> {
  await ensureIdentityStorage();
  const users = await listJsonFiles<IdentityUser>(usersRoot());
  return users.filter(Boolean).find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function saveUser(user: IdentityUser): Promise<void> {
  await writeJson(userPath(user.id), user);
}

export async function auditIdentity(event: string, input: { userId?: string | null; workspaceId?: string | null; sessionId?: string | null; provider?: string; result: "success" | "failure" | "info"; reasonCode?: string }): Promise<void> {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { identityRoot } = await import("./identity-repository.ts");
  await mkdir(identityRoot(), { recursive: true });
  await writeFile(resolve(identityRoot(), "audit.jsonl"), `${JSON.stringify({
    timestamp: now(),
    event,
    user_id: input.userId ?? null,
    workspace_id: input.workspaceId ?? null,
    session_id: input.sessionId ?? null,
    provider: input.provider,
    result: input.result,
    reason_code: input.reasonCode,
    trace_id: getTraceId() ?? createTraceId()
  })}\n`, { encoding: "utf8", flag: "a" });
}

function userPath(userId: string): string {
  return resolve(usersRoot(), `${userId}.json`);
}

async function requireUser(userId: string): Promise<IdentityUser> {
  const user = await getUser(userId);
  if (!user) throw new Error("User not found.");
  return user;
}

async function ensureDefaultMembership(user: IdentityUser): Promise<void> {
  await ensureDefaultWorkspaceMigration();
  const members = await listMembers(defaultWorkspaceId);
  if (members.some((member) => member.user_id === user.id)) return;
  await addMember(defaultWorkspaceId, { user_id: user.id, name: user.name, email: user.email, role: "owner" }, "identity");
}

function publicUser(user: IdentityUser): IdentityUser {
  const clone = { ...user };
  delete clone.password_hash;
  return clone;
}

function validateRegisterInput(input: unknown): { email: string; name: string; password: string } {
  if (!input || typeof input !== "object") throw new Error("Invalid registration payload.");
  const payload = input as { email?: unknown; name?: unknown; password?: unknown };
  if (typeof payload.email !== "string" || typeof payload.name !== "string" || typeof payload.password !== "string") throw new Error("Invalid registration payload.");
  return { email: payload.email.toLowerCase().trim(), name: payload.name.trim(), password: payload.password };
}

function validateLoginInput(input: unknown): { email: string; password: string } {
  if (!input || typeof input !== "object") throw new Error("Invalid login payload.");
  const payload = input as { email?: unknown; password?: unknown };
  if (typeof payload.email !== "string" || typeof payload.password !== "string") throw new Error("Invalid credentials.");
  return { email: payload.email.toLowerCase().trim(), password: payload.password };
}
