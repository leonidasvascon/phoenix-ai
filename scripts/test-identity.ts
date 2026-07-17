import { loginLocalUser, logoutSession, getCurrentUser } from "@phoenix-ai/identity";
import { addMember, defaultWorkspaceId, ensureDefaultWorkspaceMigration, listMembers } from "@phoenix-ai/workspace";

const email = "identity-test@phoenix.local";
const password = "Identity-Test-Password-123";

process.env.PHOENIX_AUTH_REGISTRATION_ENABLED = "true";

const identity = await import("@phoenix-ai/identity");
let user = await identity.findUserByEmail(email);
if (!user) {
  const created = await identity.registerLocalUser({ email, name: "Identity Test", password });
  user = created.user;
}

await ensureDefaultWorkspaceMigration();
const members = await listMembers(defaultWorkspaceId);
if (!members.some((member) => member.user_id === user.id)) {
  await addMember(defaultWorkspaceId, { user_id: user.id, name: user.name, email: user.email, role: "owner" }, user.id);
}

const login = await loginLocalUser({ email, password }, { ip: "127.0.0.1", userAgent: "identity-test" });
const current = await getCurrentUser(login.session.id);
if (!current || current.user.email !== email) {
  throw new Error("Identity session validation failed.");
}
await logoutSession(login.session.id);
const afterLogout = await getCurrentUser(login.session.id);
if (afterLogout) {
  throw new Error("Identity logout failed.");
}

console.log("Identity local login, session validation and logout passed.");
