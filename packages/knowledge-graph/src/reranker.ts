import type { ProvenanceResult } from "./provenance.ts";

export type RerankInput = ProvenanceResult & {
  vector_score?: number;
  graph_score?: number;
};

export function rerank(results: RerankInput[], limit = 8): ProvenanceResult[] {
  return results
    .map((result) => ({
      ...result,
      score: Number(((result.vector_score ?? 0) * 0.65 + (result.graph_score ?? 0) * 0.35 + result.score * 0.1).toFixed(6))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
