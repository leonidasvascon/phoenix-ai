import type { ExecutionAgentReport, ExecutionContext } from "../types.ts";

export function recordAgentExecution(context: ExecutionContext, report: ExecutionAgentReport): void {
  context.execution.agents.push(report);
}

