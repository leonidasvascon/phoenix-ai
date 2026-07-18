import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { FileKnowledgeGraphStore, KnowledgeIngestionService, KnowledgeRetriever, registerEntityType, registerRelationType } from "@phoenix-ai/knowledge-graph";

const knowledgeRoot = resolve(process.cwd(), ".storage", "knowledge");
await rm(knowledgeRoot, { recursive: true, force: true });

registerEntityType("Insight");
registerRelationType("influences");

const store = new FileKnowledgeGraphStore();
const ingestion = new KnowledgeIngestionService(store);
const ingestResult = await ingestion.ingest({ workspace_id: "default-workspace", sources: ["documents"] });
assert(ingestResult.entities > 0, "knowledge ingestion should create entities");
assert(ingestResult.embeddings > 0, "knowledge ingestion should create embeddings");
assert(ingestResult.provenance > 0, "knowledge ingestion should create provenance");

const snapshot = await store.read();
assert(snapshot.nodes.some((node) => node.type === "Document"), "graph should contain document entities");
assert(snapshot.edges.some((edge) => edge.type === "references"), "graph should contain relations");

const retriever = new KnowledgeRetriever(store);
const search = await retriever.search({ query: "saudade Encanto Intenso", workspace_id: "default-workspace", limit: 5 });
assert(search.results.length > 0, "hybrid RAG search should return results");
assert(Boolean(search.results[0]?.document_id), "search result should include document_id");
assert(Boolean(search.results[0]?.source), "search result should include source");
assert(Boolean(search.results[0]?.chunk), "search result should include chunk");
assert(search.metrics.documents_considered > 0, "search should report documents considered");
assert(search.metrics.entities_traversed > 0, "search should report graph traversal");

console.log(JSON.stringify({
  status: "PASS",
  entities: ingestResult.entities,
  relations: ingestResult.relations,
  results: search.results.length,
  top_source: search.results[0]?.source
}, null, 2));

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
