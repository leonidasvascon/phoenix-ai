import { auditSecret } from "./audit.ts";
import { assertSecretAccess } from "./access-policy.ts";
import { getSecretProvider } from "./provider-registry.ts";
import { parseSecretReference } from "./secret-reference.ts";
import type { ResolvedSecret, SecretAccessContext, SecretMetadata } from "./types.ts";

export async function resolveSecret(reference: string, context: SecretAccessContext): Promise<ResolvedSecret> {
  const parsed = parseSecretReference(reference);
  try {
    if (parsed.scheme === "env") {
      const resolved = await getSecretProvider("environment").get(parsed);
      await auditSecret("secret.resolved", { secretId: resolved.metadata.id, namespace: resolved.metadata.namespace, workspaceId: context.workspaceId, provider: "environment", version: resolved.metadata.version, result: "success", context });
      return resolved;
    }
    if (!parsed.workspaceId) throw new Error("Secret workspace is required.");
    await assertSecretAccess(context, parsed.workspaceId);
    const provider = getSecretProvider("encrypted_file");
    const resolved = await provider.get(parsed);
    await auditSecret("secret.resolved", { secretId: resolved.metadata.id, namespace: resolved.metadata.namespace, workspaceId: resolved.metadata.workspaceId, provider: resolved.metadata.provider, version: resolved.metadata.version, result: "success", context });
    return resolved;
  } catch (error) {
    await auditSecret("secret.access.denied", { workspaceId: parsed.workspaceId ?? context.workspaceId, namespace: parsed.namespace, result: "failure", reasonCode: error instanceof Error ? error.message : "resolve_failed", context });
    throw error;
  }
}

export async function resolveSecretValue(reference: string, context: SecretAccessContext): Promise<string> {
  return (await resolveSecret(reference, context)).value.reveal();
}
