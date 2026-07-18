import { randomUUID } from "node:crypto";
import type { Workflow } from "./workflow.ts";
import type { WorkflowExecution, WorkflowExecutionContext, WorkflowNodeHandler } from "./execution.ts";
import { validateWorkflow } from "./workflow-validator.ts";

export type WorkflowRunnerHandlers = Partial<Record<string, WorkflowNodeHandler>>;

export class WorkflowRunner {
  private readonly handlers: WorkflowRunnerHandlers;

  constructor(handlers: WorkflowRunnerHandlers = {}) {
    this.handlers = handlers;
  }

  async run(workflow: Workflow, input: Record<string, unknown> = {}): Promise<WorkflowExecution> {
    const validation = validateWorkflow(workflow);
    if (!validation.valid) throw new Error(validation.errors.join(" "));

    const startedAt = new Date().toISOString();
    const context: WorkflowExecutionContext = {
      workflow,
      input,
      variables: { ...workflow.variables, ...input },
      workspace: { id: workflow.metadata.workspace_id }
    };
    const execution: WorkflowExecution = {
      id: randomUUID(),
      workflow_id: workflow.id,
      status: "running",
      started_at: startedAt,
      completed_at: startedAt,
      steps: [],
      context: {}
    };

    try {
      for (const node of orderNodes(workflow)) {
        const nodeStartedAt = new Date().toISOString();
        const handler = this.handlers[node.type] ?? defaultHandler;
        const output = await handler(node, context);
        assignContext(node.type, context, output);
        execution.steps.push({
          node_id: node.id,
          node_type: node.type,
          status: "success",
          started_at: nodeStartedAt,
          completed_at: new Date().toISOString(),
          output
        });
      }

      execution.status = "success";
    } catch (error) {
      execution.status = "failed";
      execution.error = error instanceof Error ? error.message : "Workflow failed.";
    }

    execution.completed_at = new Date().toISOString();
    execution.context = serializeContext(context);
    return execution;
  }
}

function orderNodes(workflow: Workflow) {
  const ordered = [];
  const byId = new Map(workflow.nodes.map((node) => [node.id, node]));
  const visited = new Set<string>();
  let current = workflow.nodes.find((node) => node.type === "trigger") ?? workflow.nodes[0];

  while (current && !visited.has(current.id)) {
    ordered.push(current);
    visited.add(current.id);
    const nextEdge = workflow.edges.find((edge) => edge.from === current.id);
    current = nextEdge ? byId.get(nextEdge.to) : undefined;
  }

  return ordered;
}

async function defaultHandler(node: { type: string; config?: Record<string, unknown> }): Promise<unknown> {
  return {
    status: "noop",
    type: node.type,
    config: node.config ?? {}
  };
}

function assignContext(type: string, context: WorkflowExecutionContext, output: unknown): void {
  if (type === "task") context.execution = output;
  if (type === "strategy") context.strategy = output;
  if (type === "learning") context.learning = output;
  if (type === "evaluation") context.quality = output;
  if (type === "publishing") context.publication = output;
  if (type === "plugin") context.plugin_results = output;
}

function serializeContext(context: WorkflowExecutionContext): Record<string, unknown> {
  return {
    variables: context.variables,
    execution: context.execution,
    quality: context.quality,
    publication: context.publication,
    strategy: context.strategy,
    learning: context.learning,
    plugin_results: context.plugin_results
  };
}
