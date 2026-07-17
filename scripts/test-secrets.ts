import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createSecret, ensureSecretsStorage, listSecrets, resolveSecretValue, revokeSecret, rotateSecret } from "@phoenix-ai/secrets";

const root = await mkdtemp(resolve(tmpdir(), "phoenix-secrets-"));
const previousCwd = process.cwd();
process.chdir(root);
process.env.PHOENIX_SECRETS_MASTER_KEY = "test-master-key-for-secrets";

const context = {
  workspaceId: "default-workspace",
  actorType: "system" as const,
  actorId: "secrets-test",
  resource: "secrets",
  action: "create" as const,
  traceId: "secrets-test",
  scopes: ["secrets:*"]
};

try {
  await ensureSecretsStorage();
  const secret = await createSecret({ name: "OpenAI API Key", namespace: "openai", provider: "encrypted_file", value: "super-secret-value" }, context);
  const resolved = await resolveSecretValue(secret.reference, { ...context, action: "read" });
  if (resolved !== "super-secret-value") throw new Error("Secret resolution failed.");
  const listed = await listSecrets({ ...context, action: "read" });
  if (JSON.stringify(listed).includes("super-secret-value")) throw new Error("Secret value leaked in metadata.");
  await rotateSecret(secret.id, { value: "rotated-secret-value" }, { ...context, action: "rotate" });
  const rotated = await resolveSecretValue(secret.reference, { ...context, action: "read" });
  if (rotated !== "rotated-secret-value") throw new Error("Secret rotation failed.");
  await revokeSecret(secret.id, { ...context, action: "revoke" });
  let revokedBlocked = false;
  try {
    await resolveSecretValue(secret.reference, { ...context, action: "read" });
  } catch {
    revokedBlocked = true;
  }
  if (!revokedBlocked) throw new Error("Revoked secret resolved.");
  const storage = await readFile(resolve(root, ".storage", "secrets", "vault", `${secret.id}.v1.json`), "utf8");
  if (storage.includes("super-secret-value")) throw new Error("Plaintext leaked to vault.");
  console.log("Secrets encrypted storage, resolution, rotation and revocation passed.");
} finally {
  process.chdir(previousCwd);
  await rm(root, { recursive: true, force: true });
}
