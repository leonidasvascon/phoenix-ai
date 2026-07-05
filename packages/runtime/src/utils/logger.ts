import type { ExecutionContext } from "../types.ts";

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
}

