import { randomUUID } from "node:crypto";
import type { ExecutionContext, Task } from "../types.ts";
import { emptyCostUsage } from "./cost-tracker.ts";
import { emptyTokenUsage } from "./token-tracker.ts";

export function createExecutionContext(task: Task): ExecutionContext {
  const executionId = randomUUID();

  return {
    executionId,
    startedAt: performance.now(),
    task: {
      language: "pt-BR",
      ...task
    },
    logs: [],
    outputs: {},
    quality: {
      passed: true,
      attempts: 0,
      failed_agents: [],
      final_score: 0
    },
    execution: {
      id: executionId,
      provider: process.env.PHOENIX_PROVIDER ?? "mock",
      duration_ms: 0,
      agents: [],
      tokens: emptyTokenUsage(),
      cost: emptyCostUsage(),
      persisted: false
    }
  };
}
