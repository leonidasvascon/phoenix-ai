import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { auditSecret } from "../audit.ts";
import { decryptSecret, encryptSecret, type EncryptedPayload } from "../encryption-service.ts";
import { fileExists, metadataRoot, readJson, vaultRoot, versionsRoot, writeJson } from "../secret-repository.ts";
import { buildSecretReference, slugSecretName } from "../secret-reference.ts";
import { registerKnownSecretValue } from "../sanitization.ts";
import type { CreateSecretInput, ResolvedSecret, SecretMetadata, SecretProvider, SecretProviderStatus, SecretReference, SecretValue } from "../types.ts";
import { SecretValue as SecretValueClass } from "../types.ts";

type VaultRecord = {
  secretId: string;
  workspaceId: string;
  namespace: string;
  name: string;
  version: number;
  status: "active" | "disabled" | "invalid";
  encrypted: EncryptedPayload;
  createdAt: string;
};

export class EncryptedFileSecretProvider implements SecretProvider {
  readonly name = "encrypted_file" as const;

  async get(reference: SecretReference): Promise<ResolvedSecret> {
    const metadata = await findMetadata(reference);
    if (!metadata) throw new Error("Secret not found.");
    assertMetadataResolvable(metadata);
    const vault = await readJson<VaultRecord | null>(vaultPath(metadata.id, reference.version ?? metadata.version), null);
    if (!vault || vault.status !== "active") throw new Error("Secret version is not active.");
    const plaintext = decryptSecret(vault.encrypted);
    registerKnownSecretValue(plaintext);
    metadata.lastAccessedAt = new Date().toISOString();
    await writeJson(metadataPath(metadata.id), metadata);
    return { metadata: publicMetadata(metadata), value: SecretValueClass.from(plaintext) };
  }

  async create(input: CreateSecretInput): Promise<SecretMetadata> {
    if (!input.value) throw new Error("Secret value is required.");
    const reference = buildSecretReference(input.workspaceId, input.namespace, input.name);
    const existing = await findMetadata({ scheme: "secret", raw: reference, workspaceId: input.workspaceId, namespace: input.namespace, name: slugSecretName(input.name) });
    if (existing) throw new Error("Secret already exists.");
    const now = new Date().toISOString();
    const metadata: SecretMetadata = {
      id: `sec_${randomUUID()}`,
      workspaceId: input.workspaceId,
      name: input.name,
      namespace: input.namespace,
      provider: "encrypted_file",
      reference,
      status: "active",
      version: 1,
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt,
      createdBy: input.createdBy
    };
    await writeJson(metadataPath(metadata.id), metadata);
    await writeVault(metadata, input.value, "active");
    return publicMetadata(metadata);
  }

  async rotate(reference: SecretReference, newValue: SecretValue): Promise<SecretMetadata> {
    const metadata = await findMetadata(reference);
    if (!metadata) throw new Error("Secret not found.");
    if (metadata.status === "revoked") throw new Error("Cannot rotate revoked secret.");
    const previousVersion = metadata.version;
    const next: SecretMetadata = {
      ...metadata,
      status: "active",
      version: metadata.version + 1,
      updatedAt: new Date().toISOString(),
      rotatedAt: new Date().toISOString()
    };
    await writeVault(next, newValue.reveal(), "active");
    await writeJson(resolve(versionsRoot(), `${metadata.id}-v${previousVersion}.json`), metadata);
    await writeJson(metadataPath(metadata.id), next);
    return publicMetadata(next);
  }

  async revoke(reference: SecretReference): Promise<void> {
    const metadata = await findMetadata(reference);
    if (!metadata) throw new Error("Secret not found.");
    metadata.status = "revoked";
    metadata.updatedAt = new Date().toISOString();
    await writeJson(metadataPath(metadata.id), metadata);
  }

  async validate(): Promise<SecretProviderStatus> {
    if (!process.env.PHOENIX_SECRETS_MASTER_KEY) {
      return { name: this.name, configured: false, healthy: false, readOnly: false, reason: "PHOENIX_SECRETS_MASTER_KEY is not configured." };
    }
    try {
      const payload = encryptSecret("health-check");
      decryptSecret(payload);
      return { name: this.name, configured: true, healthy: true, readOnly: false };
    } catch (error) {
      return { name: this.name, configured: true, healthy: false, readOnly: false, reason: error instanceof Error ? error.message : "Encryption validation failed." };
    }
  }
}

export async function listEncryptedFileSecrets(): Promise<SecretMetadata[]> {
  const { listJsonFiles } = await import("../secret-repository.ts");
  const records = await listJsonFiles<SecretMetadata>(metadataRoot());
  return records.filter(Boolean).map(publicMetadata);
}

export async function getEncryptedFileSecretById(secretId: string): Promise<SecretMetadata | null> {
  return publicMetadata(await readJson<SecretMetadata | null>(metadataPath(secretId), null));
}

async function findMetadata(reference: SecretReference): Promise<SecretMetadata | null> {
  if (reference.scheme !== "secret") throw new Error("Encrypted file provider only supports secret:// references.");
  const records = await listEncryptedFileSecrets();
  const found = records.find((metadata) => metadata.reference === reference.raw || (metadata.workspaceId === reference.workspaceId && metadata.namespace === reference.namespace && slugSecretName(metadata.name) === reference.name));
  return found ? readJson<SecretMetadata | null>(metadataPath(found.id), null) : null;
}

async function writeVault(metadata: SecretMetadata, value: string, status: VaultRecord["status"]): Promise<void> {
  await writeJson(vaultPath(metadata.id, metadata.version), {
    secretId: metadata.id,
    workspaceId: metadata.workspaceId,
    namespace: metadata.namespace,
    name: metadata.name,
    version: metadata.version,
    status,
    encrypted: encryptSecret(value),
    createdAt: new Date().toISOString()
  } satisfies VaultRecord);
}

function metadataPath(secretId: string): string {
  return resolve(metadataRoot(), `${secretId}.json`);
}

function vaultPath(secretId: string, version: number): string {
  return resolve(vaultRoot(), `${secretId}.v${version}.json`);
}

function assertMetadataResolvable(metadata: SecretMetadata): void {
  if (metadata.status === "revoked") throw new Error("Secret is revoked.");
  if (metadata.status === "disabled") throw new Error("Secret is disabled.");
  if (metadata.expiresAt && Date.parse(metadata.expiresAt) <= Date.now()) throw new Error("Secret is expired.");
}

function publicMetadata<T extends SecretMetadata | null>(metadata: T): T {
  return metadata ? { ...metadata } as T : metadata;
}
