import { validateEdges } from "./edge-validator.ts";
import { WorkflowNodeRegistry } from "./node-registry.ts";
import type { Workflow } from "./workflow.ts";

export type WorkflowValidation = {
  valid: boolean;
  errors: string[];
};

export function validateWorkflow(workflow: Workflow, registry = new WorkflowNodeRegistry()): WorkflowValidation {
  const errors: string[] = [];
  const nodeIds = new Set<string>();

  if (!workflow.id) errors.push("Workflow id is required.");
  if (!workflow.name) errors.push("Workflow name is required.");
  if (!workflow.trigger?.type) errors.push("Workflow trigger is required.");
  if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) errors.push("Workflow must have at least one node.");

  for (const node of workflow.nodes ?? []) {
    if (!node.id || nodeIds.has(node.id)) errors.push(`Invalid or duplicate node id: ${node.id}`);
    nodeIds.add(node.id);
    if (!registry.get(node.type)) errors.push(`Unsupported node type: ${node.type}`);
  }

  errors.push(...validateEdges(workflow.nodes ?? [], workflow.edges ?? []));

  const triggerNodes = (workflow.nodes ?? []).filter((node) => node.type === "trigger");
  if (triggerNodes.length === 0) errors.push("Workflow must include a trigger node.");

  return {
    valid: errors.length === 0,
    errors
  };
}
