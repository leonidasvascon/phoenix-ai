import { defaultWorkspaceId } from "@phoenix-ai/workspace";
import { auditSecret } from "./audit.ts";
import { assertSecretAccess } from "./access-policy.ts";
import { getSecretProvider, listSecretProviders } from "./provider-registry.ts";
import { ensureSecretsStorage } from "./secret-repository.ts";
import { buildSecretReference, parseSecretReference } from "./secret-reference.ts";
import { validateCreateSecretInput } from "./secret-validator.ts";
import { listEncryptedFileSecrets, getEncryptedFileSecretById } from "./providers/encrypted-file-provider.ts";
import type { SecretAccessContext, SecretMetadata, SecretProviderStatus } from "./types.ts";
import { SecretValue } from "./types.ts";

export async function listSecrets(context: SecretAccessContext): Promise<SecretMetadata[]> {
  await ensureSecretsStorage();
  await assertSecretAccess({ ...context, action: "read" }, context.workspaceId);
  return (await listEncryptedFileSecrets()).filter((secret) => secret.workspaceId === context.workspaceId);
}

export async function createSecret(input: unknown, context: SecretAccessContext): Promise<SecretMetadata> {
  await ensureSecretsStorage();
  await assertSecretAccess({ ...context, action: "create" }, context.workspaceId);
  const payload = validateCreateSecretInput(input, context.workspaceId, context.actorId);
  if (payload.provider === "environment") {
    const metadata = {
      id: `env_${payload.envName}`,
      workspaceId: context.workspaceId,
      name: payload.name,
      namespace: payload.namespace,
      provider: "environment" as const,
      reference: `env://${payload.envName}`,
      status: process.env[payload.envName ?? ""] ? "active" as const : "disabled" as const,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: context.actorId
    };
    await auditSecret("secret.created", { secretId: metadata.id, namespace: metadata.namespace, workspaceId: metadata.workspaceId, provider: metadata.provider, version: 1, result: "success", context });
    return metadata;
  }
  const metadata = await getSecretProvider(payload.provider).create!(payload);
  await auditSecret("secret.created", { secretId: metadata.id, namespace: metadata.namespace, workspaceId: metadata.workspaceId, provider: metadata.provider, version: metadata.version, result: "success", context });
  return metadata;
}

export async function getSecret(secretId: string, context: SecretAccessContext): Promise<SecretMetadata | null> {
  await assertSecretAccess({ ...context, action: "read" }, context.workspaceId);
  const secret = await getEncryptedFileSecretById(secretId);
  if (!secret || secret.workspaceId !== context.workspaceId) return null;
  return secret;
}

export async function validateSecret(secretId: string, context: SecretAccessContext): Promise<{ status: "valid" | "invalid"; message: string }> {
  const secret = await requireSecret(secretId, context);
  try {
    await getSecretProvider(secret.provider).get(parseSecretReference(secret.reference));
    await auditSecret("secret.validation.succeeded", { secretId: secret.id, namespace: secret.namespace, workspaceId: secret.workspaceId, provider: secret.provider, version: secret.version, result: "success", context });
    return { status: "valid", message: "Secret resolved successfully." };
  } catch (error) {
    await auditSecret("secret.validation.failed", { secretId: secret.id, namespace: secret.namespace, workspaceId: secret.workspaceId, provider: secret.provider, version: secret.version, result: "failure", reasonCode: error instanceof Error ? error.message : "validation_failed", context });
    return { status: "invalid", message: error instanceof Error ? error.message : "Secret validation failed." };
  }
}

export async function rotateSecret(secretId: string, input: unknown, context: SecretAccessContext): Promise<SecretMetadata> {
  const secret = await requireSecret(secretId, { ...context, action: "rotate" });
  const value = typeof (input as { value?: unknown })?.value === "string" ? (input as { value: string }).value : "";
  if (!value) throw new Error("Rotation value is required.");
  await auditSecret("secret.rotation.started", { secretId: secret.id, namespace: secret.namespace, workspaceId: secret.workspaceId, provider: secret.provider, version: secret.version, result: "info", context });
  try {
    const metadata = await getSecretProvider(secret.provider).rotate!(parseSecretReference(secret.reference), SecretValue.from(value));
    await auditSecret("secret.rotation.completed", { secretId: metadata.id, namespace: metadata.namespace, workspaceId: metadata.workspaceId, provider: metadata.provider, version: metadata.version, result: "success", context });
    return metadata;
  } catch (error) {
    await auditSecret("secret.rotation.failed", { secretId: secret.id, namespace: secret.namespace, workspaceId: secret.workspaceId, provider: secret.provider, version: secret.version, result: "failure", reasonCode: error instanceof Error ? error.message : "rotation_failed", context });
    throw error;
  }
}

export async function revokeSecret(secretId: string, context: SecretAccessContext): Promise<{ status: "revoked"; id: string }> {
  const secret = await requireSecret(secretId, { ...context, action: "revoke" });
  await getSecretProvider(secret.provider).revoke!(parseSecretReference(secret.reference));
  await auditSecret("secret.revoked", { secretId: secret.id, namespace: secret.namespace, workspaceId: secret.workspaceId, provider: secret.provider, version: secret.version, result: "success", context });
  return { status: "revoked", id: secretId };
}

export async function listSecretProviderStatuses(): Promise<SecretProviderStatus[]> {
  return Promise.all(listSecretProviders().map(async (provider) => provider.validate ? provider.validate() : { name: provider.name, configured: true, healthy: true, readOnly: true }));
}

export async function getSecretsStatus(workspaceId = defaultWorkspaceId): Promise<Record<string, unknown>> {
  const secrets = (await listEncryptedFileSecrets()).filter((secret) => secret.workspaceId === workspaceId);
  return {
    provider: process.env.PHOENIX_SECRETS_PROVIDER ?? "encrypted_file",
    configured: Boolean(process.env.PHOENIX_SECRETS_MASTER_KEY),
    healthy: (await listSecretProviderStatuses()).every((provider) => provider.name !== "encrypted_file" || provider.healthy || !provider.configured),
    total: secrets.length,
    active: secrets.filter((secret) => secret.status === "active").length,
    expiring: secrets.filter((secret) => secret.expiresAt && Date.parse(secret.expiresAt) < Date.now() + 7 * 24 * 60 * 60 * 1000).length,
    revoked: secrets.filter((secret) => secret.status === "revoked").length
  };
}

async function requireSecret(secretId: string, context: SecretAccessContext): Promise<SecretMetadata> {
  const secret = await getEncryptedFileSecretById(secretId);
  if (!secret || secret.workspaceId !== context.workspaceId) throw new Error("Secret not found.");
  await assertSecretAccess(context, secret.workspaceId);
  return secret;
}
