import { addMember, defaultWorkspaceId, ensureDefaultWorkspaceMigration, listMembers } from "@phoenix-ai/workspace";
import { createLocalUser, findUserByEmail } from "@phoenix-ai/identity";

const email = process.env.PHOENIX_BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim();
const name = process.env.PHOENIX_BOOTSTRAP_ADMIN_NAME?.trim() ?? "Phoenix Admin";
const password = process.env.PHOENIX_BOOTSTRAP_ADMIN_PASSWORD;

await ensureDefaultWorkspaceMigration();

if (!email || !password) {
  console.log("Identity migration skipped bootstrap admin. Set PHOENIX_BOOTSTRAP_ADMIN_EMAIL and PHOENIX_BOOTSTRAP_ADMIN_PASSWORD to create one.");
  process.exit(0);
}

let user = await findUserByEmail(email);
if (!user) {
  user = await createLocalUser({ email, name, password, email_verified: true });
  console.log(`Created bootstrap admin: ${email}`);
} else {
  console.log(`Bootstrap admin already exists: ${email}`);
}

const members = await listMembers(defaultWorkspaceId);
if (!members.some((member) => member.user_id === user.id)) {
  await addMember(defaultWorkspaceId, { user_id: user.id, name: user.name, email: user.email, role: "owner" }, user.id);
  console.log(`Linked bootstrap admin to workspace: ${defaultWorkspaceId}`);
} else {
  console.log(`Bootstrap admin already linked to workspace: ${defaultWorkspaceId}`);
}
