import { createHash, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { readJson, sessionsRoot, writeJson } from "./identity-repository.ts";
import type { IdentitySession } from "./types.ts";

const now = () => new Date();

export function sessionCookieName(): string {
  return process.env.PHOENIX_SESSION_COOKIE_NAME ?? "phoenix_session";
}

export async function createSession(userId: string, metadata: { ip?: string; userAgent?: string } = {}): Promise<IdentitySession> {
  await cleanupExpiredSessions(userId);
  const session: IdentitySession = {
    id: `ses_${randomUUID()}`,
    user_id: userId,
    created_at: now().toISOString(),
    expires_at: new Date(Date.now() + ttlMs()).toISOString(),
    last_seen_at: now().toISOString(),
    revoked_at: null,
    ip_hash: hashMetadata(metadata.ip ?? ""),
    user_agent_summary: summarizeUserAgent(metadata.userAgent ?? "")
  };
  await writeJson(sessionPath(session.id), session);
  return session;
}

export async function validateSession(sessionId: string): Promise<IdentitySession | null> {
  if (!sessionId.startsWith("ses_")) return null;
  const session = await readJson<IdentitySession | null>(sessionPath(sessionId), null);
  if (!session || session.revoked_at) return null;
  const lastSeen = Date.parse(session.last_seen_at);
  if (Date.parse(session.expires_at) <= Date.now() || lastSeen + idleMs() <= Date.now()) return null;
  session.last_seen_at = now().toISOString();
  await writeJson(sessionPath(session.id), session);
  return session;
}

export async function revokeSession(sessionId: string): Promise<void> {
  const session = await readJson<IdentitySession | null>(sessionPath(sessionId), null);
  if (!session) return;
  session.revoked_at = now().toISOString();
  await writeJson(sessionPath(sessionId), session);
}

export async function listUserSessions(userId: string): Promise<IdentitySession[]> {
  const { readdir } = await import("node:fs/promises");
  let files: string[] = [];
  try {
    files = await readdir(sessionsRoot());
  } catch {
    return [];
  }
  const sessions = await Promise.all(files.filter((file) => file.endsWith(".json")).map((file) => readJson<IdentitySession | null>(resolve(sessionsRoot(), file), null)));
  return sessions.filter((session): session is IdentitySession => Boolean(session && session.user_id === userId));
}

export function buildSessionCookie(sessionId: string): string {
  const secure = (process.env.PHOENIX_SESSION_COOKIE_SECURE ?? "false") === "true";
  const maxAge = Math.floor(ttlMs() / 1000);
  return `${sessionCookieName()}=${sessionId}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(): string {
  return `${sessionCookieName()}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

function sessionPath(sessionId: string): string {
  return resolve(sessionsRoot(), `${sessionId}.json`);
}

function ttlMs(): number {
  return Number(process.env.PHOENIX_SESSION_TTL_HOURS ?? 24) * 60 * 60 * 1000;
}

function idleMs(): number {
  return Number(process.env.PHOENIX_SESSION_IDLE_TIMEOUT_MINUTES ?? 60) * 60 * 1000;
}

async function cleanupExpiredSessions(_userId: string): Promise<void> {
  // Kept intentionally small for v1; validation handles expiry lazily.
}

function hashMetadata(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function summarizeUserAgent(value: string): string {
  return value.slice(0, 120);
}
