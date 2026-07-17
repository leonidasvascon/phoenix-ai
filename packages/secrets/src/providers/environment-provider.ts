import { auditSecret } from "../audit.ts";
import { registerKnownSecretValue } from "../sanitization.ts";
import type { ResolvedSecret, SecretMetadata, SecretProvider, SecretProviderStatus, SecretReference, SecretValue } from "../types.ts";
import { SecretValue as SecretValueClass } from "../types.ts";

export class EnvironmentSecretProvider implements SecretProvider {
  readonly name = "environment" as const;

  async get(reference: SecretReference): Promise<ResolvedSecret> {
    if (reference.scheme !== "env") throw new Error("Environment provider only supports env:// references.");
    const value = process.env[reference.name];
    if (!value) throw new Error("Environment secret is not configured.");
    registerKnownSecretValue(value);
    return {
      metadata: this.metadata(reference),
      value: SecretValueClass.from(value)
    };
  }

  async rotate(_reference: SecretReference, _newValue: SecretValue): Promise<SecretMetadata> {
    throw new Error("Environment secrets are read-only.");
  }

  async revoke(_reference: SecretReference): Promise<void> {
    throw new Error("Environment secrets are read-only.");
  }

  async validate(): Promise<SecretProviderStatus> {
    return { name: this.name, configured: true, healthy: true, readOnly: true };
  }

  private metadata(reference: SecretReference): SecretMetadata {
    const now = new Date().toISOString();
    return {
      id: `env_${reference.name}`,
      workspaceId: reference.workspaceId ?? "environment",
      name: reference.name,
      namespace: "internal",
      provider: "environment",
      reference: reference.raw,
      status: process.env[reference.name] ? "active" : "disabled",
      version: 1,
      createdAt: now,
      updatedAt: now
    };
  }
}
