# ADR 0005 — API Contract Source of Truth

Status: Accepted

## Context

Phoenix API now needs to be consumed by Studio, n8n, internal systems and future customers. Maintaining OpenAPI schemas and TypeScript SDK contracts independently would create drift over time.

## Decision

Phoenix AI adopts **Option B — TypeScript/routes as the source of truth** for v1 of the API contract.

The OpenAPI document is maintained as code in `apps/api/src/openapi/*`, close to the API routes and shared TypeScript concepts. The generated artifacts in `docs/openapi/phoenix-api.json` and `docs/openapi/phoenix-api.yaml` are build artifacts produced from that source.

The SDK uses explicit TypeScript request/response contracts in `packages/phoenix-sdk/src/types.ts` and is validated against the documented API paths through CI scripts.

## Consequences

- API route changes must update the OpenAPI source files in the same PR.
- `pnpm run openapi:generate` refreshes JSON/YAML artifacts.
- `pnpm run openapi:validate` fails when required public paths are missing or secrets appear in the spec.
- `pnpm run sdk:test` validates SDK error handling and trace propagation.
- Future work may move to full OpenAPI-driven SDK generation once the API stabilizes.
