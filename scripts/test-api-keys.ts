import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { authenticateStoredApiKey, createApiKey, listApiKeys, revokeApiKey } from "@phoenix-ai/secrets";

const root = await mkdtemp(resolve(tmpdir(), "phoenix-api-keys-"));
const previousCwd = process.cwd();
process.chdir(root);

const context = {
  workspaceId: "default-workspace",
  actorType: "system" as const,
  actorId: "api-key-test",
  resource: "secrets",
  action: "create" as const,
  traceId: "api-key-test",
  scopes: ["secrets:*"]
};

try {
  const created = await createApiKey({ scopes: ["tasks:write"] }, context);
  if (!created.api_key.startsWith("phx_live_")) throw new Error("API key format invalid.");
  const listed = await listApiKeys({ ...context, action: "read" });
  if (JSON.stringify(listed).includes(created.api_key)) throw new Error("API key leaked after creation.");
  const authenticated = await authenticateStoredApiKey(created.api_key);
  if (!authenticated) throw new Error("Stored API key did not authenticate.");
  await revokeApiKey(created.metadata.id, { ...context, action: "revoke" });
  const afterRevoke = await authenticateStoredApiKey(created.api_key);
  if (afterRevoke) throw new Error("Revoked API key authenticated.");
  console.log("API key hash storage and revocation passed.");
} finally {
  process.chdir(previousCwd);
  await rm(root, { recursive: true, force: true });
}
