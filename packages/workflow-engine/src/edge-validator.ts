import type { WorkflowEdge, WorkflowNode } from "./workflow.ts";

export function validateEdges(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edgeIds = new Set<string>();

  for (const edge of edges) {
    if (!edge.id || edgeIds.has(edge.id)) errors.push(`Invalid or duplicate edge id: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.from)) errors.push(`Edge ${edge.id} references missing source node ${edge.from}.`);
    if (!nodeIds.has(edge.to)) errors.push(`Edge ${edge.id} references missing target node ${edge.to}.`);
    if (edge.from === edge.to) errors.push(`Edge ${edge.id} cannot point to the same node.`);
  }

  return errors;
}
