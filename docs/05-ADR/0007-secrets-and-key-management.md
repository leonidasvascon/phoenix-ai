# ADR 0007 — Secrets and Key Management

Status: Accepted

## Context

Phoenix AI now has Identity, Workspaces, providers and publishing integrations. Secrets such as OpenAI keys, Meta tokens and API keys must not be copied through configuration, logs, traces, backups or Studio screens.

## Decision

Phoenix uses secret references as the public contract. Runtime modules request a reference such as `secret://default-workspace/openai/api-key` or `env://OPENAI_API_KEY`, and `@phoenix-ai/secrets` resolves the value only in memory.

The local encrypted provider uses Node.js crypto AES-256-GCM with a unique 96-bit nonce per write. The master key is supplied through `PHOENIX_SECRETS_MASTER_KEY` and is never stored in `.storage`. GCM authentication detects tampering and wrong keys fail closed.

Secret metadata is public. Plaintext values, encrypted payloads and master keys are not public API fields. `SecretValue` redacts itself through `toString()` and `toJSON()`.

API Keys are stored as SHA-256 hashes with prefix metadata. The full key is returned only once during creation or rotation.

Backups exclude the encrypted vault by default. A separate `backup:secrets` command creates an encrypted backup when explicitly confirmed.

## Consequences

- Providers can migrate from env vars to references incrementally.
- Secret values are available only at the external call boundary.
- Owners and admins can create, rotate, validate and revoke, but cannot reveal stored values.
- Local encrypted storage is suitable for controlled deployments, while future providers can add AWS Secrets Manager, Azure Key Vault, Google Secret Manager or HashiCorp Vault behind the same interface.

## Limitations

- External KMS/HSM integrations are outside this version.
- Automatic provider-side rotation is deferred.
- Restore of secret backups remains intentionally explicit in v1.
