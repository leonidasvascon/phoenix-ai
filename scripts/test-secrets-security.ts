import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createSecret, ensureSecretsStorage, resolveSecretValue, sanitizeSecretPayload } from "@phoenix-ai/secrets";

const root = await mkdtemp(resolve(tmpdir(), "phoenix-secrets-security-"));
const previousCwd = process.cwd();
process.chdir(root);
process.env.PHOENIX_SECRETS_MASTER_KEY = "security-master-key";

const context = {
  workspaceId: "workspace-a",
  actorType: "system" as const,
  actorId: "security-test",
  resource: "secrets",
  action: "create" as const,
  traceId: "security-test",
  scopes: ["secrets:*"]
};

try {
  await ensureSecretsStorage();
  const secret = await createSecret({ name: "Meta Access Token", namespace: "meta", provider: "encrypted_file", value: "meta-token-secret" }, context);
  const vaultPath = resolve(root, ".storage", "secrets", "vault", `${secret.id}.v1.json`);
  const vault = await readFile(vaultPath, "utf8");
  if (vault.includes("meta-token-secret")) throw new Error("Plaintext secret appeared in vault.");
  if (vault.includes("security-master-key")) throw new Error("Master key appeared in storage.");

  let isolated = false;
  try {
    await resolveSecretValue(secret.reference, { ...context, workspaceId: "workspace-b", action: "read" });
  } catch {
    isolated = true;
  }
  if (!isolated) throw new Error("Workspace isolation failed.");

  const tampered = vault.replace(/.$/, "x");
  await writeFile(vaultPath, tampered, "utf8");
  let tamperRejected = false;
  try {
    await resolveSecretValue(secret.reference, { ...context, action: "read" });
  } catch {
    tamperRejected = true;
  }
  if (!tamperRejected) throw new Error("Tampered vault was not rejected.");

  const sanitized = JSON.stringify(sanitizeSecretPayload({ accessToken: "meta-token-secret", nested: { authorization: "Bearer meta-token-secret" } }));
  if (sanitized.includes("meta-token-secret")) throw new Error("Sanitizer leaked secret.");
  console.log("Secrets security checks passed.");
} finally {
  process.chdir(previousCwd);
  await rm(root, { recursive: true, force: true });
}
