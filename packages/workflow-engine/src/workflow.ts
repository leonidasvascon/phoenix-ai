export type WorkflowNodeType =
  | "trigger"
  | "task"
  | "strategy"
  | "learning"
  | "evaluation"
  | "condition"
  | "delay"
  | "publishing"
  | "webhook"
  | "notification"
  | "scheduler"
  | "plugin"
  | "knowledge_search"
  | "knowledge_update"
  | "knowledge_ingest";

export type WorkflowTriggerType = "manual" | "scheduler" | "webhook";

export type WorkflowNode = {
  id: string;
  type: WorkflowNodeType;
  name: string;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
};

export type WorkflowEdge = {
  id: string;
  from: string;
  to: string;
  condition?: string;
};

export type Workflow = {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: WorkflowTriggerType;
    config?: Record<string, unknown>;
  };
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, unknown>;
  metadata: {
    workspace_id: string;
    created_at: string;
    updated_at: string;
    version: string;
  };
};

export type WorkflowInput = Partial<Omit<Workflow, "id" | "metadata">> & {
  id?: unknown;
  name?: unknown;
  workspace_id?: unknown;
};
