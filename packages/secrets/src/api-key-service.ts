import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { auditSecret } from "./audit.ts";
import { listJsonFiles, metadataRoot, readJson, writeJson } from "./secret-repository.ts";
import type { ApiKeyMetadata, SecretAccessContext } from "./types.ts";

const apiKeysRoot = () => resolve(metadataRoot(), "api-keys");
const now = () => new Date().toISOString();

export async function listApiKeys(context: SecretAccessContext): Promise<Array<Omit<ApiKeyMetadata, "key_hash">>> {
  const keys = await listJsonFiles<ApiKeyMetadata>(apiKeysRoot());
  return keys.filter((key) => key.workspace_id === context.workspaceId).map(publicApiKey);
}

export async function createApiKey(input: unknown, context: SecretAccessContext): Promise<{ api_key: string; metadata: Omit<ApiKeyMetadata, "key_hash"> }> {
  const payload = input && typeof input === "object" ? input as { scopes?: unknown; expires_at?: unknown } : {};
  const raw = `phx_live_${randomBytes(32).toString("base64url")}`;
  const metadata: ApiKeyMetadata = {
    id: `key_${randomUUID()}`,
    key_id: `kid_${randomUUID()}`,
    key_prefix: raw.slice(0, 13),
    key_hash: hashApiKey(raw),
    workspace_id: context.workspaceId,
    scopes: Array.isArray(payload.scopes) ? payload.scopes.filter((scope): scope is string => typeof scope === "string") : ["*"],
    status: "active",
    created_by: context.actorId,
    created_at: now(),
    updated_at: now(),
    expires_at: typeof payload.expires_at === "string" ? payload.expires_at : undefined
  };
  await writeJson(apiKeyPath(metadata.id), metadata);
  await auditSecret("api_key.created", { workspaceId: context.workspaceId, actorId: context.actorId, actorType: context.actorType, result: "success", context });
  return { api_key: raw, metadata: publicApiKey(metadata) };
}

export async function authenticateStoredApiKey(raw: string): Promise<ApiKeyMetadata | null> {
  if (!raw.startsWith("phx_")) return null;
  const keys = await listJsonFiles<ApiKeyMetadata>(apiKeysRoot());
  const hash = hashApiKey(raw);
  const key = keys.find((item) => item.status === "active" && safeEqual(item.key_hash, hash) && (!item.expires_at || Date.parse(item.expires_at) > Date.now()));
  if (!key) return null;
  key.last_used_at = now();
  await writeJson(apiKeyPath(key.id), key);
  return key;
}

export async function rotateApiKey(keyId: string, context: SecretAccessContext): Promise<{ api_key: string; metadata: Omit<ApiKeyMetadata, "key_hash"> }> {
  const key = await requireApiKey(keyId, context);
  key.status = "revoked";
  key.revoked_at = now();
  key.updated_at = now();
  await writeJson(apiKeyPath(key.id), key);
  const created = await createApiKey({ scopes: key.scopes, expires_at: key.expires_at }, context);
  await auditSecret("api_key.rotated", { workspaceId: context.workspaceId, actorId: context.actorId, actorType: context.actorType, result: "success", context });
  return created;
}

export async function revokeApiKey(keyId: string, context: SecretAccessContext): Promise<{ status: "revoked"; id: string }> {
  const key = await requireApiKey(keyId, context);
  key.status = "revoked";
  key.revoked_at = now();
  key.updated_at = now();
  await writeJson(apiKeyPath(key.id), key);
  await auditSecret("api_key.revoked", { workspaceId: context.workspaceId, actorId: context.actorId, actorType: context.actorType, result: "success", context });
  return { status: "revoked", id: key.id };
}

export async function deleteApiKey(keyId: string, context: SecretAccessContext): Promise<{ status: "deleted"; id: string }> {
  await revokeApiKey(keyId, context);
  return { status: "deleted", id: keyId };
}

function apiKeyPath(keyId: string): string {
  return resolve(apiKeysRoot(), `${keyId}.json`);
}

async function requireApiKey(keyId: string, context: SecretAccessContext): Promise<ApiKeyMetadata> {
  const key = await readJson<ApiKeyMetadata | null>(apiKeyPath(keyId), null);
  if (!key || key.workspace_id !== context.workspaceId) throw new Error("API key not found.");
  return key;
}

function publicApiKey(key: ApiKeyMetadata): Omit<ApiKeyMetadata, "key_hash"> {
  const { key_hash: _hash, ...metadata } = key;
  return metadata;
}

function hashApiKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
