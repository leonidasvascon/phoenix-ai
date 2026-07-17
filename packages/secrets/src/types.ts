export type SecretNamespace = "openai" | "meta" | "oidc" | "publishing" | "assets" | "email" | "webhooks" | "internal" | string;
export type SecretProviderName = "environment" | "encrypted_file" | "memory";
export type SecretStatus = "active" | "disabled" | "rotating" | "revoked" | "invalid";

export type SecretMetadata = {
  id: string;
  workspaceId: string;
  name: string;
  namespace: SecretNamespace;
  provider: SecretProviderName;
  reference: string;
  status: SecretStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  rotatedAt?: string;
  expiresAt?: string;
  createdBy?: string;
  lastAccessedAt?: string;
};

export type SecretReference = {
  scheme: "secret" | "env";
  workspaceId?: string;
  namespace?: string;
  name: string;
  version?: number;
  raw: string;
};

export type SecretAccessContext = {
  workspaceId: string;
  actorType: "user" | "service" | "system";
  actorId: string;
  resource: string;
  action: "read" | "create" | "rotate" | "revoke" | "validate";
  traceId: string;
  scopes?: string[];
};

export type CreateSecretInput = {
  workspaceId: string;
  name: string;
  namespace: SecretNamespace;
  provider: SecretProviderName;
  value?: string;
  envName?: string;
  expiresAt?: string;
  createdBy?: string;
};

export type RotateSecretInput = {
  value: string;
  actorId?: string;
};

export type SecretProviderStatus = {
  name: SecretProviderName;
  configured: boolean;
  healthy: boolean;
  readOnly: boolean;
  reason?: string;
};

export type ResolvedSecret = {
  metadata: SecretMetadata;
  value: SecretValue;
};

export class SecretValue {
  readonly __phoenixSecretValue = true;
  private readonly internalValue: string;

  private constructor(value: string) {
    this.internalValue = value;
  }

  static from(value: string): SecretValue {
    return new SecretValue(value);
  }

  reveal(): string {
    return this.internalValue;
  }

  toString(): string {
    return "[REDACTED]";
  }

  toJSON(): string {
    return "[REDACTED]";
  }
}

export interface SecretProvider {
  name: SecretProviderName;
  get(reference: SecretReference): Promise<ResolvedSecret>;
  create?(input: CreateSecretInput): Promise<SecretMetadata>;
  rotate?(reference: SecretReference, newValue: SecretValue): Promise<SecretMetadata>;
  revoke?(reference: SecretReference): Promise<void>;
  validate?(): Promise<SecretProviderStatus>;
}

export type ApiKeyMetadata = {
  id: string;
  key_id: string;
  key_prefix: string;
  key_hash: string;
  workspace_id: string;
  scopes: string[];
  status: "active" | "revoked";
  created_by?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  last_used_at?: string;
  revoked_at?: string;
};
