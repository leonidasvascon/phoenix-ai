import type { KnowledgeEdge } from "./edge.ts";
import type { KnowledgeNode } from "./node.ts";

export type GraphSearchResult = {
  node: KnowledgeNode;
  relations: KnowledgeEdge[];
  score: number;
};

export function searchGraph(input: {
  query: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  workspace_id?: string;
  limit?: number;
}): GraphSearchResult[] {
  const terms = input.query.toLowerCase().split(/[^a-z0-9\u00c0-\u017f]+/).filter(Boolean);
  const nodes = input.workspace_id ? input.nodes.filter((node) => node.workspace_id === input.workspace_id) : input.nodes;

  return nodes
    .map((node) => {
      const haystack = `${node.type} ${node.label} ${JSON.stringify(node.metadata)}`.toLowerCase();
      const lexical = terms.filter((term) => haystack.includes(term)).length / Math.max(terms.length, 1);
      const relations = input.edges.filter((edge) => edge.from === node.id || edge.to === node.id);
      const relationBoost = Math.min(relations.length * 0.05, 0.25);
      return {
        node,
        relations,
        score: Number((lexical + relationBoost).toFixed(4))
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 10);
}
