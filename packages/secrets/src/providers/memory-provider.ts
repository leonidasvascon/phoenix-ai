import { randomUUID } from "node:crypto";
import { buildSecretReference } from "../secret-reference.ts";
import type { CreateSecretInput, ResolvedSecret, SecretMetadata, SecretProvider, SecretProviderStatus, SecretReference, SecretValue } from "../types.ts";
import { SecretValue as SecretValueClass } from "../types.ts";

export class MemorySecretProvider implements SecretProvider {
  readonly name = "memory" as const;
  private readonly values = new Map<string, SecretValue>();
  private readonly metadata = new Map<string, SecretMetadata>();

  async get(reference: SecretReference): Promise<ResolvedSecret> {
    const metadata = this.metadata.get(reference.raw);
    const value = this.values.get(reference.raw);
    if (!metadata || !value) throw new Error("Secret not found.");
    if (metadata.status !== "active") throw new Error("Secret is not active.");
    return { metadata, value };
  }

  async create(input: CreateSecretInput): Promise<SecretMetadata> {
    if (!input.value) throw new Error("Secret value is required.");
    const reference = buildSecretReference(input.workspaceId, input.namespace, input.name);
    const now = new Date().toISOString();
    const metadata: SecretMetadata = {
      id: `sec_${randomUUID()}`,
      workspaceId: input.workspaceId,
      name: input.name,
      namespace: input.namespace,
      provider: "memory",
      reference,
      status: "active",
      version: 1,
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt,
      createdBy: input.createdBy
    };
    this.metadata.set(reference, metadata);
    this.values.set(reference, SecretValueClass.from(input.value));
    return metadata;
  }

  async rotate(reference: SecretReference, newValue: SecretValue): Promise<SecretMetadata> {
    const metadata = this.metadata.get(reference.raw);
    if (!metadata) throw new Error("Secret not found.");
    const updated = { ...metadata, version: metadata.version + 1, status: "active" as const, updatedAt: new Date().toISOString(), rotatedAt: new Date().toISOString() };
    this.metadata.set(reference.raw, updated);
    this.values.set(reference.raw, newValue);
    return updated;
  }

  async revoke(reference: SecretReference): Promise<void> {
    const metadata = this.metadata.get(reference.raw);
    if (metadata) this.metadata.set(reference.raw, { ...metadata, status: "revoked", updatedAt: new Date().toISOString() });
  }

  async validate(): Promise<SecretProviderStatus> {
    return { name: this.name, configured: true, healthy: true, readOnly: false };
  }
}
