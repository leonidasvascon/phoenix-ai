import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { acceptInvitation, createInvitation, createWorkspace, defaultWorkspaceId, ensureDefaultWorkspaceMigration } from "@phoenix-ai/workspace";
import { buildAuthorizationContext, createLocalUser, createSession, getCurrentUser, revokeSession, setUserStatus } from "@phoenix-ai/identity";

const root = await mkdtemp(resolve(tmpdir(), "phoenix-identity-security-"));
const previousCwd = process.cwd();
process.chdir(root);

try {
  await ensureDefaultWorkspaceMigration();
  const user = await createLocalUser({ email: "identity-security@phoenix.local", name: "Identity Security", password: "Identity-Security-123", email_verified: true });
  const session = await createSession(user.id, { ip: "127.0.0.1", userAgent: "identity-security-test" });
  await revokeSession(session.id);
  if (await getCurrentUser(session.id)) throw new Error("Revoked session was accepted.");

  const disabledSession = await createSession(user.id);
  await setUserStatus(user.id, "disabled");
  if (await getCurrentUser(disabledSession.id)) throw new Error("Disabled user session was accepted.");

  let noMembershipRejected = false;
  await createWorkspace({ id: "isolated-workspace", name: "Isolated Workspace" }, "other-user");
  try {
    await buildAuthorizationContext({ userId: user.id, sessionId: disabledSession.id, workspaceId: "isolated-workspace" });
  } catch {
    noMembershipRejected = true;
  }
  if (!noMembershipRejected) throw new Error("Workspace without membership was authorized.");

  process.env.PHOENIX_INVITATION_TTL_DAYS = "-1";
  const expired = await createInvitation(defaultWorkspaceId, { email: "expired@phoenix.local", role: "viewer" }, "system") as { id: string; token: string };
  let expiredRejected = false;
  try {
    await acceptInvitation(defaultWorkspaceId, expired.id, { user_id: "expired-user", name: "Expired", email: "expired@phoenix.local" });
  } catch {
    expiredRejected = true;
  }
  if (!expiredRejected) throw new Error("Expired invitation was accepted.");

  process.env.PHOENIX_INVITATION_TTL_DAYS = "7";
  const invitation = await createInvitation(defaultWorkspaceId, { email: "reuse@phoenix.local", role: "viewer" }, "system") as { id: string; token: string };
  await acceptInvitation(defaultWorkspaceId, invitation.id, { user_id: "reuse-user", name: "Reuse", email: "reuse@phoenix.local" });
  let reusedRejected = false;
  try {
    await acceptInvitation(defaultWorkspaceId, invitation.id, { user_id: "reuse-user-2", name: "Reuse 2", email: "reuse@phoenix.local" });
  } catch {
    reusedRejected = true;
  }
  if (!reusedRejected) throw new Error("Reused invitation was accepted.");

  console.log("Identity security checks passed.");
} finally {
  process.chdir(previousCwd);
  await rm(root, { recursive: true, force: true });
}
