# ADR 0006 — Identity and SSO v1

Status: Accepted

## Context

Phoenix AI already supported API Key authentication and multi-tenant workspaces. Enterprise usage requires human users, sessions, account recovery paths, invitation flows and future SSO providers without removing service-to-service API access.

## Decision

Identity v1 uses opaque server-side session IDs stored in HttpOnly cookies for Studio users. API Key authentication remains supported for automation, SDK usage and integrations.

OIDC providers are modeled as replaceable providers. The first implementation includes a mock provider and generic provider configuration through environment variables. Real providers can be added without changing Studio or Runtime contracts.

Workspace RBAC remains the authorization source. A session resolves to a user, the user resolves to workspace membership, and permissions are evaluated from workspace role capabilities.

Invitations use one-time opaque tokens. The raw token is returned only at creation time and only a SHA-256 hash is persisted.

## Consequences

- Studio can authenticate users without storing API keys in local storage.
- Automation clients can continue using API keys.
- Future SSO providers can be integrated behind the same routes and SDK resource.
- Lost invitation tokens cannot be recovered from storage and must be regenerated.
- Password reset delivery is intentionally deferred until an email provider is configured.
