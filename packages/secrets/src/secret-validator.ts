import type { CreateSecretInput, SecretNamespace, SecretProviderName } from "./types.ts";

const namespaces = new Set(["openai", "meta", "oidc", "publishing", "assets", "email", "webhooks", "internal"]);

export function validateCreateSecretInput(input: unknown, workspaceId: string, actorId?: string): CreateSecretInput {
  if (!input || typeof input !== "object") throw new Error("Invalid secret payload.");
  const payload = input as { name?: unknown; namespace?: unknown; provider?: unknown; value?: unknown; envName?: unknown; expiresAt?: unknown };
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const namespace = typeof payload.namespace === "string" ? payload.namespace.trim() : "";
  const provider = typeof payload.provider === "string" ? payload.provider.trim() : "encrypted_file";
  if (!name) throw new Error("Secret name is required.");
  if (!namespace || !namespaces.has(namespace)) throw new Error("Invalid secret namespace.");
  if (!isSecretProviderName(provider)) throw new Error("Invalid secret provider.");
  if (provider === "environment" && typeof payload.envName !== "string") throw new Error("Environment secret requires envName.");
  if (provider !== "environment" && typeof payload.value !== "string") throw new Error("Secret value is required.");
  return {
    workspaceId,
    name,
    namespace: namespace as SecretNamespace,
    provider,
    value: typeof payload.value === "string" ? payload.value : undefined,
    envName: typeof payload.envName === "string" ? payload.envName : undefined,
    expiresAt: typeof payload.expiresAt === "string" ? payload.expiresAt : undefined,
    createdBy: actorId
  };
}

export function isSecretProviderName(value: string): value is SecretProviderName {
  return value === "environment" || value === "encrypted_file" || value === "memory";
}
