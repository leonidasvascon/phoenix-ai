# @phoenix-ai/agent-sdk

The Agent SDK defines the interface that every Phoenix AI agent must implement.

Agents should not know which AI model is being used.

They should depend only on a stable interface.

## Planned interface

```ts
export interface Agent<TInput = unknown, TOutput = unknown> {
  id: string;
  execute(input: TInput, context: ExecutionContext): Promise<TOutput>;
}
```

## Goal

This allows Phoenix AI to use different providers without changing agent contracts:

- OpenAI
- Claude
- Gemini
- Llama
- local models

