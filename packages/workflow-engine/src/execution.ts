import type { Workflow, WorkflowNode } from "./workflow.ts";

export type WorkflowExecutionStatus = "running" | "success" | "failed";
export type WorkflowNodeExecutionStatus = "success" | "skipped" | "failed";

export type WorkflowExecutionContext = {
  workflow: Workflow;
  input: Record<string, unknown>;
  variables: Record<string, unknown>;
  workspace: { id: string };
  execution?: unknown;
  brand?: unknown;
  quality?: unknown;
  publication?: unknown;
  assets?: unknown;
  strategy?: unknown;
  learning?: unknown;
  plugin_results?: unknown;
};

export type WorkflowNodeHandler = (
  node: WorkflowNode,
  context: WorkflowExecutionContext
) => Promise<unknown> | unknown;

export type WorkflowExecutionStep = {
  node_id: string;
  node_type: string;
  status: WorkflowNodeExecutionStatus;
  started_at: string;
  completed_at: string;
  output?: unknown;
  error?: string;
};

export type WorkflowExecution = {
  id: string;
  workflow_id: string;
  status: WorkflowExecutionStatus;
  started_at: string;
  completed_at: string;
  steps: WorkflowExecutionStep[];
  context: Record<string, unknown>;
  error?: string;
};
