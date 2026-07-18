import { FileKnowledgeGraphStore, KnowledgeIngestionService, KnowledgeRetriever } from "@phoenix-ai/knowledge-graph";

const store = new FileKnowledgeGraphStore();

export async function listKnowledgeEntities() {
  const snapshot = await store.read();
  return snapshot.nodes;
}

export async function listKnowledgeRelations() {
  const snapshot = await store.read();
  return snapshot.edges;
}

export async function getKnowledgeGraph() {
  const snapshot = await store.read();
  return {
    ...snapshot,
    summary: {
      entities: snapshot.nodes.length,
      relations: snapshot.edges.length,
      embeddings: snapshot.embeddings.length,
      provenance: snapshot.provenance.length
    }
  };
}

export async function ingestKnowledge(input: unknown) {
  const payload = input && typeof input === "object" ? input as { workspace_id?: unknown; sources?: unknown } : {};
  const service = new KnowledgeIngestionService(store);
  return service.ingest({
    workspace_id: typeof payload.workspace_id === "string" ? payload.workspace_id : undefined,
    sources: Array.isArray(payload.sources) ? payload.sources.map((item) => String(item)) as never : undefined
  });
}

export async function searchKnowledge(input: unknown) {
  const payload = input && typeof input === "object" ? input as { query?: unknown; workspace_id?: unknown; limit?: unknown } : {};
  const query = typeof payload.query === "string" ? payload.query : "";
  const retriever = new KnowledgeRetriever(store);
  return retriever.search({
    query,
    workspace_id: typeof payload.workspace_id === "string" ? payload.workspace_id : undefined,
    limit: typeof payload.limit === "number" ? payload.limit : undefined
  });
}
