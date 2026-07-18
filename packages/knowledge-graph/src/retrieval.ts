import { performance } from "node:perf_hooks";
import { executePluginHook } from "@phoenix-ai/plugin-sdk";
import { logStructured, recordDuration, withSpan } from "@phoenix-ai/observability";
import { cosineSimilarity, HashEmbeddingProvider, type EmbeddingProvider } from "./embedding-index.ts";
import { FileKnowledgeGraphStore } from "./graph.ts";
import { searchGraph } from "./graph-search.ts";
import { rerank } from "./reranker.ts";

export type KnowledgeSearchQuery = {
  query: string;
  workspace_id?: string;
  limit?: number;
};

export type KnowledgeSearchResponse = {
  query: string;
  workspace_id?: string;
  results: ReturnType<typeof rerank>;
  metrics: {
    embedding_ms: number;
    vector_search_ms: number;
    graph_search_ms: number;
    rerank_ms: number;
    documents_considered: number;
    entities_traversed: number;
  };
};

export class KnowledgeRetriever {
  private readonly store: FileKnowledgeGraphStore;
  private readonly embeddingProvider: EmbeddingProvider;

  constructor(
    store = new FileKnowledgeGraphStore(),
    embeddingProvider: EmbeddingProvider = new HashEmbeddingProvider()
  ) {
    this.store = store;
    this.embeddingProvider = embeddingProvider;
  }

  async search(query: KnowledgeSearchQuery): Promise<KnowledgeSearchResponse> {
    if (!query.query?.trim()) throw new Error("Search query is required.");
    const snapshot = await this.store.read();
    const workspaceId = query.workspace_id;
    let started = performance.now();
    const vector = await withSpan("phoenix.knowledge_graph.embedding", {}, () => this.embeddingProvider.embed(query.query));
    const embeddingMs = Math.round(performance.now() - started);

    started = performance.now();
    const embeddings = workspaceId ? snapshot.embeddings.filter((item) => item.workspace_id === workspaceId) : snapshot.embeddings;
    const vectorMatches = embeddings
      .map((embedding) => ({ embedding, score: cosineSimilarity(vector, embedding.vector) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max((query.limit ?? 8) * 2, 10));
    const vectorSearchMs = Math.round(performance.now() - started);

    started = performance.now();
    const graphMatches = searchGraph({
      query: query.query,
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      workspace_id: workspaceId,
      limit: Math.max((query.limit ?? 8) * 2, 10)
    });
    const graphSearchMs = Math.round(performance.now() - started);

    started = performance.now();
    const graphScores = new Map(graphMatches.map((item) => [item.node.id, item.score]));
    const vectorScores = new Map(vectorMatches.map((item) => [item.embedding.entity_id, item.score]));
    const provenance = snapshot.provenance
      .filter((item) => !workspaceId || item.workspace_id === workspaceId)
      .filter((item) => vectorScores.has(item.entity_id) || graphScores.has(item.entity_id))
      .map((item) => ({
        ...item,
        entity: snapshot.nodes.find((node) => node.id === item.entity_id),
        vector_score: vectorScores.get(item.entity_id) ?? 0,
        graph_score: graphScores.get(item.entity_id) ?? 0
      }));
    const results = rerank(provenance, query.limit ?? 8);
    const rerankMs = Math.round(performance.now() - started);
    const metrics = {
      embedding_ms: embeddingMs,
      vector_search_ms: vectorSearchMs,
      graph_search_ms: graphSearchMs,
      rerank_ms: rerankMs,
      documents_considered: embeddings.length,
      entities_traversed: graphMatches.length
    };

    for (const [name, value] of Object.entries(metrics)) {
      recordDuration(`phoenix_knowledge_graph_${name}`, value);
    }
    await executePluginHook("afterStrategy", { type: "knowledge_search", query, result_count: results.length }, workspaceId);
    logStructured("info", "knowledge_graph.search.completed", { query: query.query, workspace_id: workspaceId, result_count: results.length, ...metrics });

    return { query: query.query, workspace_id: workspaceId, results, metrics };
  }
}
