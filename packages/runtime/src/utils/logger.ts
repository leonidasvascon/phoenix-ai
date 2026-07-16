import type { ExecutionContext } from "../types.ts";
import { logStructured } from "@phoenix-ai/observability";

export function logStep(
  context: ExecutionContext,
  step: string,
  status: "success" | "error",
  message: string
): void {
  context.logs.push({
    step,
    status,
    message,
    timestamp: new Date().toISOString()
  });
  logStructured(status === "error" ? "error" : "info", status === "error" ? `${step}.failed` : `${step}.completed`, {
    execution_id: context.executionId,
    step,
    status,
    message
  });
}
