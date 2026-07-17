import type { PhoenixClient } from "../client.ts";
import type { PhoenixApiKeyMetadata, PhoenixSecretMetadata } from "../types.ts";

export class SecretsResource {
  private readonly client: PhoenixClient;

  constructor(client: PhoenixClient) {
    this.client = client;
  }

  list(): Promise<PhoenixSecretMetadata[]> {
    return this.client.request("/secrets");
  }

  create(input: { name: string; namespace: string; provider: "environment" | "encrypted_file" | "memory"; value?: string; envName?: string }): Promise<PhoenixSecretMetadata> {
    return this.client.request("/secrets", { method: "POST", body: input });
  }

  get(id: string): Promise<PhoenixSecretMetadata> {
    return this.client.request(`/secrets/${encodeURIComponent(id)}`);
  }

  validate(id: string): Promise<{ status: string; message: string }> {
    return this.client.request(`/secrets/${encodeURIComponent(id)}/validate`, { method: "POST" });
  }

  rotate(id: string, value: string): Promise<PhoenixSecretMetadata> {
    return this.client.request(`/secrets/${encodeURIComponent(id)}/rotate`, { method: "POST", body: { value } });
  }

  revoke(id: string): Promise<{ status: string; id: string }> {
    return this.client.request(`/secrets/${encodeURIComponent(id)}/revoke`, { method: "POST" });
  }
}

export class ApiKeysResource {
  private readonly client: PhoenixClient;

  constructor(client: PhoenixClient) {
    this.client = client;
  }

  list(): Promise<PhoenixApiKeyMetadata[]> {
    return this.client.request("/api-keys");
  }

  create(input: { scopes?: string[]; expires_at?: string } = {}): Promise<{ api_key: string; metadata: PhoenixApiKeyMetadata }> {
    return this.client.request("/api-keys", { method: "POST", body: input });
  }

  rotate(id: string): Promise<{ api_key: string; metadata: PhoenixApiKeyMetadata }> {
    return this.client.request(`/api-keys/${encodeURIComponent(id)}/rotate`, { method: "POST" });
  }

  revoke(id: string): Promise<{ status: string; id: string }> {
    return this.client.request(`/api-keys/${encodeURIComponent(id)}/revoke`, { method: "POST" });
  }
}
