# @phoenix-ai/runtime

Phoenix Runtime is the internal execution engine of Phoenix AI.

All agent execution must go through:

```ts
Runtime.execute(task)
```

Agents should never be called directly by apps, automations, or the Studio.

## Responsibilities

- Validate task input.
- Load Brand DNA.
- Discover the correct pipeline.
- Execute agents in order.
- Validate agent outputs.
- Log execution steps.
- Aggregate final output.
- Return a JSON response compatible with `schemas/response.schema.json`.

## Planned API

```ts
const result = await Runtime.execute({
  brand: "encanto-intenso",
  theme: "saudade",
  objective: "viralizar",
  platform: "instagram",
  format: "reel",
  language: "pt-BR"
});
```

## Runtime flow

Task

-> Validate Task

-> Load Brand

-> Load Pipeline

-> Create Execution Context

-> Execute Agents

-> Validate Result

-> Return Response

