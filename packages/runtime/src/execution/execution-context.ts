import { randomUUID } from "node:crypto";
import { getTraceId } from "@phoenix-ai/observability";
import type { ExecutionContext, Task } from "../types.ts";
import { emptyCostUsage } from "./cost-tracker.ts";
import { emptyTokenUsage } from "./token-tracker.ts";

export function createExecutionContext(task: Task): ExecutionContext {
  const executionId = randomUUID();
  const traceId = getTraceId();

  return {
    executionId,
    trace_id: traceId,
    startedAt: performance.now(),
    task: {
      language: "pt-BR",
      ...task
    },
    logs: [],
    outputs: {},
    learning_recommendations: [],
    prompt_optimizations: [],
    quality: {
      passed: true,
      attempts: 0,
      failed_agents: [],
      final_score: 0,
      publishable: false,
      rejection_reasons: []
    },
    execution: {
      id: executionId,
      trace_id: traceId,
      provider: process.env.PHOENIX_PROVIDER ?? "mock",
      duration_ms: 0,
      agents: [],
      tokens: emptyTokenUsage(),
      cost: emptyCostUsage(),
      persisted: false
    }
  };
}
