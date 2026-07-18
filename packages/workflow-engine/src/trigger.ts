import type { WorkflowTriggerType } from "./workflow.ts";

export function isWorkflowTrigger(value: unknown): value is WorkflowTriggerType {
  return value === "manual" || value === "scheduler" || value === "webhook";
}
