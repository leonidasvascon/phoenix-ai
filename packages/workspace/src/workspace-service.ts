import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createTraceId, getTraceId } from "@phoenix-ai/observability";
import { defaultRoles, hasPermission, isWorkspaceRole, type WorkspaceAction, type WorkspaceResource, type WorkspaceRole } from "./role-service.ts";
import { defaultWorkspaceId, listWorkspaceIds, readJsonFile, workspaceExists, workspacePath, writeJsonFile } from "./workspace-repository.ts";
import { slugifyWorkspaceName, validateWorkspaceId } from "./workspace-validator.ts";

export type Workspace = {
  id: string;
  name: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  settings: Record<string, unknown>;
};
export type WorkspaceMember = {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  role: WorkspaceRole;
  status: "active" | "invited" | "disabled";
  created_at: string;
  updated_at: string;
};
export type WorkspaceInvitation = {
  id: string;
  email: string;
  role: WorkspaceRole;
  token_hash?: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  expires_at?: string;
  accepted_at?: string;
  rejected_at?: string;
};
export type WorkspaceContext = {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
};

const now = () => new Date().toISOString();

export async function ensureDefaultWorkspaceMigration(): Promise<Workspace> {
  const workspace = workspaceExists(defaultWorkspaceId)
    ? await getWorkspace(defaultWorkspaceId)
    : await createWorkspace({ id: defaultWorkspaceId, name: "Phoenix Default Workspace" }, "system");

  await ensureDefaultMember(defaultWorkspaceId);
  await linkExistingBrands(defaultWorkspaceId);
  return workspace as Workspace;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  await ensureDefaultWorkspaceMigration();
  const ids = await listWorkspaceIds();
  const workspaces = await Promise.all(ids.map((id) => getWorkspace(id)));
  return workspaces.filter((workspace): workspace is Workspace => Boolean(workspace));
}

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  validateWorkspaceId(workspaceId);
  return readJsonFile<Workspace | null>(resolve(workspacePath(workspaceId), "workspace.json"), null);
}

export async function createWorkspace(input: unknown, userId = "local-user"): Promise<Workspace> {
  const payload = validateWorkspaceInput(input);
  const workspaceId = payload.id ?? slugifyWorkspaceName(payload.name);

  if (!workspaceId) throw new Error("Workspace name must generate a valid id.");
  validateWorkspaceId(workspaceId);
  if (workspaceExists(workspaceId)) throw new Error("Workspace already exists.");

  const workspace: Workspace = {
    id: workspaceId,
    name: payload.name,
    status: "active",
    settings: payload.settings,
    created_at: now(),
    updated_at: now()
  };

  await mkdir(workspacePath(workspaceId), { recursive: true });
  await writeJsonFile(resolve(workspacePath(workspaceId), "workspace.json"), workspace);
  await writeJsonFile(resolve(workspacePath(workspaceId), "roles.json"), defaultRoles);
  await writeJsonFile(resolve(workspacePath(workspaceId), "settings.json"), payload.settings);
  await writeJsonFile(resolve(workspacePath(workspaceId), "members.json"), [
    defaultMember(workspaceId, userId, "Owner", "owner")
  ]);
  await audit(workspaceId, userId, "workspace.created");
  return workspace;
}

export async function updateWorkspace(workspaceId: string, input: unknown, userId = "local-user"): Promise<Workspace> {
  const workspace = await requireWorkspace(workspaceId);
  const payload = input && typeof input === "object" ? input as { name?: unknown; settings?: unknown } : {};
  const updated: Workspace = {
    ...workspace,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : workspace.name,
    settings: payload.settings && typeof payload.settings === "object" && !Array.isArray(payload.settings) ? payload.settings as Record<string, unknown> : workspace.settings,
    updated_at: now()
  };
  await writeJsonFile(resolve(workspacePath(workspaceId), "workspace.json"), updated);
  await writeJsonFile(resolve(workspacePath(workspaceId), "settings.json"), updated.settings);
  await audit(workspaceId, userId, "workspace.updated");
  return updated;
}

export async function listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  await requireWorkspace(workspaceId);
  return readMembers(workspaceId);
}

export async function addMember(workspaceId: string, input: unknown, userId = "local-user"): Promise<WorkspaceMember> {
  await requireWorkspace(workspaceId);
  const payload = validateMemberInput(input);
  const members = await readMembers(workspaceId);
  const member: WorkspaceMember = {
    id: randomUUID(),
    user_id: payload.user_id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    status: "active",
    created_at: now(),
    updated_at: now()
  };
  members.push(member);
  await writeMembers(workspaceId, members);
  await audit(workspaceId, userId, "member.added", { member_id: member.id, role: member.role });
  return member;
}

export async function updateMember(workspaceId: string, memberId: string, input: unknown, userId = "local-user"): Promise<WorkspaceMember> {
  const members = await readMembers(workspaceId);
  const member = members.find((item) => item.id === memberId);
  if (!member) throw new Error("Member not found.");
  const payload = input && typeof input === "object" ? input as { role?: unknown; status?: unknown } : {};
  if (payload.role !== undefined) {
    if (!isWorkspaceRole(payload.role)) throw new Error("Invalid role.");
    member.role = payload.role;
  }
  if (payload.status === "active" || payload.status === "disabled" || payload.status === "invited") {
    member.status = payload.status;
  }
  member.updated_at = now();
  await writeMembers(workspaceId, members);
  await audit(workspaceId, userId, "member.updated", { member_id: member.id, role: member.role });
  return member;
}

export async function removeMember(workspaceId: string, memberId: string, userId = "local-user"): Promise<{ status: "deleted"; id: string }> {
  const members = await readMembers(workspaceId);
  const nextMembers = members.filter((member) => member.id !== memberId);
  if (members.length === nextMembers.length) throw new Error("Member not found.");
  await writeMembers(workspaceId, nextMembers);
  await audit(workspaceId, userId, "member.deleted", { member_id: memberId });
  return { status: "deleted", id: memberId };
}

export async function createInvitation(workspaceId: string, input: unknown, userId = "local-user"): Promise<WorkspaceInvitation> {
  await requireWorkspace(workspaceId);
  const payload = validateInvitationInput(input);
  const invitations = await readJsonFile<WorkspaceInvitation[]>(resolve(workspacePath(workspaceId), "invitations.json"), []);
  const token = randomBytes(32).toString("base64url");
  const invitation: WorkspaceInvitation = {
    id: randomUUID(),
    email: payload.email,
    role: payload.role,
    token_hash: hashInvitationToken(token),
    status: "pending",
    created_at: now(),
    expires_at: new Date(Date.now() + Number(process.env.PHOENIX_INVITATION_TTL_DAYS ?? 7) * 24 * 60 * 60 * 1000).toISOString()
  };
  invitations.push(invitation);
  await writeJsonFile(resolve(workspacePath(workspaceId), "invitations.json"), invitations);
  await audit(workspaceId, userId, "invitation.created", { invitation_id: invitation.id, role: invitation.role });
  return { ...invitation, token } as WorkspaceInvitation & { token: string };
}

export async function listInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  await requireWorkspace(workspaceId);
  return readJsonFile<WorkspaceInvitation[]>(resolve(workspacePath(workspaceId), "invitations.json"), []);
}

export async function acceptInvitation(workspaceId: string, invitationId: string, user: { user_id: string; name: string; email: string }): Promise<WorkspaceInvitation> {
  const invitations = await listInvitations(workspaceId);
  const invitation = invitations.find((item) => item.id === invitationId);
  if (!invitation || invitation.status !== "pending") throw new Error("Invitation not found.");
  if (invitation.expires_at && Date.parse(invitation.expires_at) <= Date.now()) throw new Error("Invitation expired.");
  invitation.status = "accepted";
  invitation.accepted_at = now();
  await writeJsonFile(resolve(workspacePath(workspaceId), "invitations.json"), invitations);
  const members = await readMembers(workspaceId);
  if (!members.some((member) => member.user_id === user.user_id)) {
    await addMember(workspaceId, { user_id: user.user_id, name: user.name, email: user.email, role: invitation.role }, user.user_id);
  }
  await audit(workspaceId, user.user_id, "invitation.accepted", { invitation_id: invitation.id, role: invitation.role });
  return invitation;
}

export async function rejectInvitation(workspaceId: string, invitationId: string, userId = "anonymous"): Promise<WorkspaceInvitation> {
  const invitations = await listInvitations(workspaceId);
  const invitation = invitations.find((item) => item.id === invitationId);
  if (!invitation || invitation.status !== "pending") throw new Error("Invitation not found.");
  invitation.status = "rejected";
  invitation.rejected_at = now();
  await writeJsonFile(resolve(workspacePath(workspaceId), "invitations.json"), invitations);
  await audit(workspaceId, userId, "invitation.rejected", { invitation_id: invitation.id });
  return invitation;
}

export async function findInvitationByToken(token: string): Promise<{ workspaceId: string; invitation: WorkspaceInvitation } | null> {
  const tokenHash = hashInvitationToken(token);
  for (const workspaceId of await listWorkspaceIds()) {
    const invitations = await readJsonFile<WorkspaceInvitation[]>(resolve(workspacePath(workspaceId), "invitations.json"), []);
    const invitation = invitations.find((item) => item.token_hash === tokenHash);
    if (invitation) return { workspaceId, invitation };
  }
  return null;
}

export async function resolveWorkspaceContext(headers: { [key: string]: string | string[] | undefined }): Promise<WorkspaceContext> {
  await ensureDefaultWorkspaceMigration();
  const header = headers["x-phoenix-workspace-id"];
  const workspaceId = Array.isArray(header) ? header[0] : header ?? defaultWorkspaceId;
  const userHeader = headers["x-phoenix-user-id"];
  const userId = Array.isArray(userHeader) ? userHeader[0] : userHeader ?? "local-user";
  await requireWorkspace(workspaceId);
  const members = await readMembers(workspaceId);
  const member = members.find((item) => item.user_id === userId && item.status === "active") ?? members.find((item) => item.role === "owner");
  if (!member) throw new Error("Workspace member not found.");
  return { workspace_id: workspaceId, user_id: userId, role: member.role };
}

export function assertWorkspacePermission(context: WorkspaceContext, resource: WorkspaceResource, action: WorkspaceAction): void {
  if (!hasPermission(context.role, resource, action)) {
    throw new Error("Workspace permission denied.");
  }
}

export async function audit(workspaceId: string, userId: string, action: string, metadata: Record<string, unknown> = {}): Promise<void> {
  const event = {
    timestamp: now(),
    workspace_id: workspaceId,
    user_id: userId,
    action,
    trace_id: getTraceId() ?? createTraceId(),
    metadata
  };
  await mkdir(workspacePath(workspaceId), { recursive: true });
  await writeFile(resolve(workspacePath(workspaceId), "audit.jsonl"), `${JSON.stringify(event)}\n`, { encoding: "utf8", flag: "a" });
}

async function requireWorkspace(workspaceId: string): Promise<Workspace> {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) throw new Error("Workspace not found.");
  return workspace;
}

async function ensureDefaultMember(workspaceId: string): Promise<void> {
  const members = await readMembers(workspaceId);
  if (members.length > 0) return;
  await writeMembers(workspaceId, [defaultMember(workspaceId, "local-user", "Owner", "owner")]);
}

function defaultMember(workspaceId: string, userId: string, name: string, role: WorkspaceRole): WorkspaceMember {
  return {
    id: `${workspaceId}-${role}`,
    user_id: userId,
    name,
    role,
    status: "active",
    created_at: now(),
    updated_at: now()
  };
}

async function readMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  return readJsonFile<WorkspaceMember[]>(resolve(workspacePath(workspaceId), "members.json"), []);
}

async function writeMembers(workspaceId: string, members: WorkspaceMember[]): Promise<void> {
  await writeJsonFile(resolve(workspacePath(workspaceId), "members.json"), members);
}

async function linkExistingBrands(workspaceId: string): Promise<void> {
  const brandsPath = resolve(process.cwd(), "prompts", "brands");
  let files: string[] = [];
  try {
    files = await readdir(brandsPath);
  } catch {
    return;
  }
  await Promise.all(files
    .filter((file) => file.endsWith(".yaml") && !file.endsWith(".brand.yaml"))
    .map(async (file) => {
      const path = resolve(brandsPath, file);
      const source = await readFile(path, "utf8");
      if (/^workspace_id:/m.test(source)) return;
      await writeFile(path, `${source.trimEnd()}\n\nworkspace_id: ${workspaceId}\n`, "utf8");
    }));
}

function validateWorkspaceInput(input: unknown): { id?: string; name: string; settings: Record<string, unknown> } {
  if (!input || typeof input !== "object") throw new Error("Invalid workspace payload.");
  const payload = input as { id?: unknown; name?: unknown; settings?: unknown };
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name) throw new Error("Workspace name is required.");
  const id = typeof payload.id === "string" && payload.id.trim() ? payload.id.trim() : undefined;
  if (id) validateWorkspaceId(id);
  const settings = payload.settings && typeof payload.settings === "object" && !Array.isArray(payload.settings) ? payload.settings as Record<string, unknown> : {};
  return { id, name, settings };
}

function validateMemberInput(input: unknown): { user_id: string; name: string; email?: string; role: WorkspaceRole } {
  if (!input || typeof input !== "object") throw new Error("Invalid member payload.");
  const payload = input as { user_id?: unknown; name?: unknown; email?: unknown; role?: unknown };
  const user_id = typeof payload.user_id === "string" && payload.user_id.trim() ? payload.user_id.trim() : randomUUID();
  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : user_id;
  if (!isWorkspaceRole(payload.role)) throw new Error("Invalid role.");
  const email = typeof payload.email === "string" && payload.email.trim() ? payload.email.trim() : undefined;
  return { user_id, name, email, role: payload.role };
}

function validateInvitationInput(input: unknown): { email: string; role: WorkspaceRole } {
  if (!input || typeof input !== "object") throw new Error("Invalid invitation payload.");
  const payload = input as { email?: unknown; role?: unknown };
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!email.includes("@")) throw new Error("Invalid email.");
  if (!isWorkspaceRole(payload.role)) throw new Error("Invalid role.");
  return { email, role: payload.role };
}

function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
