import { createWorkflow, deleteWorkflow, getWorkflow, listWorkflowExecutions, runWorkflow } from "../apps/api/src/services/workflow-service.ts";

const workflow = await createWorkflow({
  id: "workflow-smoke-test",
  name: "Workflow Smoke Test",
  nodes: [
    { id: "trigger", type: "trigger", name: "Manual Trigger" },
    { id: "task", type: "task", name: "Generate Content", config: { brand: "encanto-intenso", theme: "saudade", objective: "viralizar", platform: "instagram", format: "reel" } },
    { id: "evaluation", type: "evaluation", name: "Evaluation" },
    { id: "condition", type: "condition", name: "Quality Gate", config: { expression: "quality.average_overall_score >= 95" } },
    { id: "plugin", type: "plugin", name: "Plugin Hook" },
    { id: "notification", type: "notification", name: "Notification" }
  ],
  edges: [
    { id: "e1", from: "trigger", to: "task" },
    { id: "e2", from: "task", to: "evaluation" },
    { id: "e3", from: "evaluation", to: "condition" },
    { id: "e4", from: "condition", to: "plugin" },
    { id: "e5", from: "plugin", to: "notification" }
  ]
});

const loaded = await getWorkflow(workflow.id);
if (!loaded) throw new Error("Workflow was not persisted.");

const execution = await runWorkflow(workflow.id);
if (execution.status !== "success") throw new Error(`Workflow execution failed: ${execution.error ?? "unknown"}`);
if (execution.steps.length < 5) throw new Error("Workflow did not execute expected steps.");

const executions = await listWorkflowExecutions(workflow.id);
if (executions[0]?.id !== execution.id) throw new Error("Workflow execution history was not persisted.");

await deleteWorkflow(workflow.id);

console.log(JSON.stringify({
  status: "PASS",
  workflow_id: workflow.id,
  execution_id: execution.id,
  steps: execution.steps.map((step) => step.node_type)
}, null, 2));
