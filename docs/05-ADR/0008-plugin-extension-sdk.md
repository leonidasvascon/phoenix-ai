# ADR 0008 - Plugin and Extension SDK

Status: Accepted

## Context

Phoenix AI reached a point where new capabilities should not require changes to the platform core. Agents, providers, analytics, scheduler, publishing and Studio extensions need a stable extension surface.

## Decision

Create `packages/plugin-sdk` as the official extension layer.

Plugins are discovered from `/plugins`, declared through `plugin.json`, validated against the Phoenix engine version and operated through a registry stored in `.storage/plugins/`.

The SDK exposes:

- `definePlugin`
- plugin manifests
- capabilities
- lifecycle hooks
- runtime hooks
- logical sandboxing with timeout and exception handling
- isolated plugin storage
- secret resolution through the Secrets Engine

## Consequences

The Phoenix core can evolve while plugins remain isolated behind stable contracts. Invalid, incompatible or slow plugins must not crash the API or block Runtime execution.

The first implementation intentionally uses logical isolation, not process-level isolation. Stronger sandboxing can be added later without changing the public plugin contract.
