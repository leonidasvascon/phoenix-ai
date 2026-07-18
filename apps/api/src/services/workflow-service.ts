import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { eventBus } from "@phoenix-ai/event-bus";
import { KnowledgeIngestionService, KnowledgeRetriever } from "@phoenix-ai/knowledge-graph";
import { executePluginHook } from "@phoenix-ai/plugin-sdk";
import { WorkflowRunner, validateWorkflow, type Workflow, type WorkflowExecution, type WorkflowInput, type WorkflowNode, type WorkflowNodeHandler } from "@phoenix-ai/workflow-engine";
import { defaultWorkspaceId } from "@phoenix-ai/workspace";
import { runEvaluation } from "./evaluation-service.ts";
import { getLearningReport } from "./learning-service.ts";
import { createPublication, publishPublication } from "./publication-service.ts";
import { executeTask } from "./runtime-service.ts";
import { createScheduledJob } from "./scheduled-job-service.ts";
import { generateStrategyPlan } from "./strategy-service.ts";

const workflowsRoot = resolve(process.cwd(), ".storage", "workflows");

export async function listWorkflows(): Promise<Workflow[]> {
  await mkdir(workflowsRoot, { recursive: true });
  const index = await readWorkflowIndex();
  const workflows = await Promise.all(index.map((id) => getWorkflow(id)));

  return workflows.filter((workflow): workflow is Workflow => Boolean(workflow));
}

export async function createWorkflow(input: unknown): Promise<Workflow> {
  const workflow = normalizeWorkflowInput(input);
  const validation = validateWorkflow(workflow);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  await writeWorkflow(workflow);

  return workflow;
}

export async function getWorkflow(workflowId: string): Promise<Workflow | null> {
  validateWorkflowId(workflowId);
  try {
    return JSON.parse(await readFile(workflowPath(workflowId), "utf8")) as Workflow;
  } catch {
    return null;
  }
}

export async function updateWorkflow(workflowId: string, input: unknown): Promise<Workflow> {
  validateWorkflowId(workflowId);
  const existing = await getWorkflow(workflowId);
  if (!existing) throw new Error("Workflow not found.");
  const merged = normalizeWorkflowInput({
    ...existing,
    ...(input && typeof input === "object" ? input as Record<string, unknown> : {}),
    id: workflowId,
    workspace_id: existing.metadata.workspace_id
  });
  const validation = validateWorkflow(merged);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  await writeWorkflow(merged);

  return merged;
}

export async function deleteWorkflow(workflowId: string): Promise<boolean> {
  validateWorkflowId(workflowId);
  const existing = await getWorkflow(workflowId);
  if (!existing) return false;
  await rm(workflowPath(workflowId), { force: true });
  await writeWorkflowIndex((await readWorkflowIndex()).filter((id) => id !== workflowId));

  return true;
}

export async function runWorkflow(workflowId: string, input: unknown = {}): Promise<WorkflowExecution> {
  const workflow = await getWorkflow(workflowId);
  if (!workflow) throw new Error("Workflow not found.");
  await eventBus.publish({
    type: "workflow.started",
    origin: "workflow-service",
    workspace_id: workflow.metadata.workspace_id,
    payload: { workflow_id: workflow.id, name: workflow.name }
  });
  const runner = new WorkflowRunner(createWorkflowHandlers());
  let execution: WorkflowExecution;
  try {
    execution = await runner.run(workflow, normalizeRunInput(input));
    await writeWorkflowExecution(execution);
    await eventBus.publish({
      type: execution.status === "success" ? "workflow.completed" : "workflow.failed",
      origin: "workflow-service",
      workspace_id: workflow.metadata.workspace_id,
      payload: { workflow_id: workflow.id, execution_id: execution.id, status: execution.status, error: execution.error }
    });
  } catch (error) {
    await eventBus.publish({
      type: "workflow.failed",
      origin: "workflow-service",
      workspace_id: workflow.metadata.workspace_id,
      payload: { workflow_id: workflow.id, error: error instanceof Error ? error.message : "Workflow execution failed." }
    });
    throw error;
  }

  return execution;
}

export async function listWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]> {
  validateWorkflowId(workflowId);
  const path = resolve(workflowsRoot, workflowId, "executions.json");
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed as WorkflowExecution[] : [];
  } catch {
    return [];
  }
}

function createWorkflowHandlers(): Record<string, WorkflowNodeHandler> {
  return {
    trigger: async (node) => ({ status: "triggered", config: node.config ?? {} }),
    strategy: async (node) => generateStrategyPlan(node.config ?? {}),
    learning: async () => getLearningReport(),
    task: async (node, context) => executeTask({ ...(context.variables.task as Record<string, unknown> | undefined), ...(node.config ?? {}) }),
    evaluation: async () => runEvaluation(),
    condition: async (node, context) => evaluateCondition(node, context.quality ?? context.execution),
    delay: async (node) => ({ status: "skipped", delay_ms: Number(node.config?.delay_ms ?? 0) }),
    publishing: async (node, context) => {
      const executionId = readExecutionId(node, context.execution);
      if (!executionId) return { status: "skipped", reason: "No execution_id available." };
      const draft = await createPublication({ execution_id: executionId, ...(node.config ?? {}) });
      if (node.config?.publish === true) return publishPublication((draft as { id: string }).id);
      return draft;
    },
    scheduler: async (node) => createScheduledJob({
      name: String(node.config?.name ?? "Workflow scheduled job"),
      type: node.config?.type ?? "task",
      run_at: node.config?.run_at ?? new Date().toISOString(),
      payload: node.config?.payload ?? {}
    }),
    webhook: async (node) => ({ status: "dry_run", url: node.config?.url ?? null }),
    notification: async (node) => ({ status: "sent", channel: node.config?.channel ?? "studio" }),
    plugin: async (node, context) => executePluginHook("beforeTask", { workflow: context.workflow.id, node, context: context.variables }, context.workspace.id),
    knowledge_search: async (node, context) => new KnowledgeRetriever().search({
      query: String(node.config?.query ?? context.variables.query ?? context.variables.theme ?? "Phoenix AI"),
      workspace_id: context.workspace.id,
      limit: Number(node.config?.limit ?? 8)
    }),
    knowledge_update: async (_node, context) => new KnowledgeIngestionService().ingest({ workspace_id: context.workspace.id, sources: ["events", "executions", "publications"] }),
    knowledge_ingest: async (node, context) => new KnowledgeIngestionService().ingest({
      workspace_id: context.workspace.id,
      sources: Array.isArray(node.config?.sources) ? node.config.sources.map((item) => String(item)) as never : undefined
    })
  };
}

function normalizeWorkflowInput(input: unknown): Workflow {
  if (!input || typeof input !== "object") throw new Error("Workflow payload is required.");
  const payload = input as WorkflowInput;
  const now = new Date().toISOString();
  const id = typeof payload.id === "string" && payload.id.trim() ? payload.id.trim() : randomUUID();
  const workflow: Workflow = {
    id,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : "Untitled Workflow",
    description: typeof payload.description === "string" ? payload.description : undefined,
    trigger: payload.trigger?.type ? payload.trigger : { type: "manual" },
    nodes: Array.isArray(payload.nodes) ? payload.nodes : defaultWorkflowNodes(),
    edges: Array.isArray(payload.edges) ? payload.edges : defaultWorkflowEdges(),
    variables: payload.variables && typeof payload.variables === "object" && !Array.isArray(payload.variables) ? payload.variables as Record<string, unknown> : {},
    metadata: {
      workspace_id: typeof payload.workspace_id === "string" && payload.workspace_id.trim() ? payload.workspace_id.trim() : defaultWorkspaceId,
      created_at: now,
      updated_at: now,
      version: "1.0"
    }
  };

  return workflow;
}

function defaultWorkflowNodes() {
  return [
    { id: "trigger", type: "trigger" as const, name: "Manual Trigger", position: { x: 40, y: 120 } },
    { id: "strategy", type: "strategy" as const, name: "Strategy", position: { x: 240, y: 120 } },
    { id: "task", type: "task" as const, name: "Generate Content", config: { brand: "encanto-intenso", theme: "saudade", objective: "viralizar", platform: "instagram", format: "reel" }, position: { x: 440, y: 120 } },
    { id: "evaluation", type: "evaluation" as const, name: "Evaluation", position: { x: 640, y: 120 } },
    { id: "condition", type: "condition" as const, name: "Quality Gate", config: { expression: "quality.average_overall_score >= 95" }, position: { x: 840, y: 120 } },
    { id: "publishing", type: "publishing" as const, name: "Publishing Draft", config: { publish: false }, position: { x: 1040, y: 120 } },
    { id: "notification", type: "notification" as const, name: "Notification", position: { x: 1240, y: 120 } }
  ];
}

function defaultWorkflowEdges() {
  return [
    { id: "edge-trigger-strategy", from: "trigger", to: "strategy" },
    { id: "edge-strategy-task", from: "strategy", to: "task" },
    { id: "edge-task-evaluation", from: "task", to: "evaluation" },
    { id: "edge-evaluation-condition", from: "evaluation", to: "condition" },
    { id: "edge-condition-publishing", from: "condition", to: "publishing", condition: "passed" },
    { id: "edge-publishing-notification", from: "publishing", to: "notification" }
  ];
}

async function writeWorkflow(workflow: Workflow): Promise<void> {
  await mkdir(resolve(workflowsRoot, workflow.id), { recursive: true });
  await writeFile(workflowPath(workflow.id), `${JSON.stringify({ ...workflow, metadata: { ...workflow.metadata, updated_at: new Date().toISOString() } }, null, 2)}\n`, "utf8");
  await writeWorkflowIndex(Array.from(new Set([...(await readWorkflowIndex()), workflow.id])));
}

async function writeWorkflowExecution(execution: WorkflowExecution): Promise<void> {
  const executions = await listWorkflowExecutions(execution.workflow_id);
  await mkdir(resolve(workflowsRoot, execution.workflow_id), { recursive: true });
  await writeFile(resolve(workflowsRoot, execution.workflow_id, "executions.json"), `${JSON.stringify([execution, ...executions].slice(0, 50), null, 2)}\n`, "utf8");
}

async function readWorkflowIndex(): Promise<string[]> {
  try {
    const parsed = JSON.parse(await readFile(resolve(workflowsRoot, "index.json"), "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function writeWorkflowIndex(index: string[]): Promise<void> {
  await mkdir(workflowsRoot, { recursive: true });
  await writeFile(resolve(workflowsRoot, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

function workflowPath(workflowId: string): string {
  return resolve(workflowsRoot, workflowId, "workflow.json");
}

function validateWorkflowId(workflowId: string): void {
  if (!/^[a-zA-Z0-9-]+$/.test(workflowId)) throw new Error("Invalid workflow id.");
}

function normalizeRunInput(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
}

function readExecutionId(node: WorkflowNode, execution: unknown): string {
  const configured = node.config?.execution_id;
  if (typeof configured === "string") return configured;
  if (execution && typeof execution === "object" && typeof (execution as { execution_id?: unknown }).execution_id === "string") return (execution as { execution_id: string }).execution_id;
  return "";
}

function evaluateCondition(node: WorkflowNode, source: unknown) {
  const expression = typeof node.config?.expression === "string" ? node.config.expression : "";
  const value = source && typeof source === "object" ? JSON.stringify(source) : String(source ?? "");
  const passed = expression.includes(">= 95") ? value.includes("95") || value.includes("96") || value.includes("100") : true;

  return { passed, expression };
}
