import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { eventBus } from "@phoenix-ai/event-bus";
import { loadKnowledgeBase } from "@phoenix-ai/knowledge-engine";
import { executePluginHook } from "@phoenix-ai/plugin-sdk";
import { logStructured, recordDuration, withSpan } from "@phoenix-ai/observability";
import { createEmbeddingProvider, type EmbeddingProvider } from "./embedding-index.ts";
import { FileKnowledgeGraphStore, type KnowledgeGraphSnapshot } from "./graph.ts";
import type { KnowledgeEdge } from "./edge.ts";
import type { KnowledgeNode } from "./node.ts";
import type { KnowledgeProvenance } from "./provenance.ts";

export type KnowledgeIngestSource = "documents" | "workflows" | "strategies" | "executions" | "publications" | "plugins" | "events";

export type KnowledgeIngestInput = {
  workspace_id?: string;
  sources?: KnowledgeIngestSource[];
};

export type KnowledgeIngestResult = {
  status: "success";
  workspace_id: string;
  sources: KnowledgeIngestSource[];
  entities: number;
  relations: number;
  embeddings: number;
  provenance: number;
};

export class KnowledgeIngestionService {
  private readonly store: FileKnowledgeGraphStore;
  private readonly embeddingProvider: EmbeddingProvider;

  constructor(
    store = new FileKnowledgeGraphStore(),
    embeddingProvider: EmbeddingProvider = createEmbeddingProvider()
  ) {
    this.store = store;
    this.embeddingProvider = embeddingProvider;
  }

  async ingest(input: KnowledgeIngestInput = {}): Promise<KnowledgeIngestResult> {
    const workspaceId = input.workspace_id ?? "default-workspace";
    const sources = input.sources?.length ? input.sources : ["documents", "workflows", "strategies", "executions", "publications", "plugins", "events"];
    const started = performance.now();
    const snapshot = await this.store.read();
    const additions: KnowledgeGraphSnapshot = { nodes: [], edges: [], embeddings: [], provenance: [] };

    await executePluginHook("beforeStrategy", { type: "knowledge_ingest", workspace_id: workspaceId, sources }, workspaceId);

    for (const source of sources) {
      if (source === "documents") await this.ingestDocuments(workspaceId, additions);
      if (source === "workflows") await this.ingestJsonDirectory(workspaceId, "Workflow", "workflows", resolve(process.cwd(), ".storage", "workflows"), additions);
      if (source === "strategies") await this.ingestJsonDirectory(workspaceId, "Campaign", "strategies", resolve(process.cwd(), ".storage", "strategy"), additions);
      if (source === "executions") await this.ingestJsonDirectory(workspaceId, "Task", "executions", resolve(process.cwd(), ".storage", "executions"), additions);
      if (source === "publications") await this.ingestJsonDirectory(workspaceId, "Publication", "publications", resolve(process.cwd(), ".storage", "publications"), additions);
      if (source === "plugins") await this.ingestJsonDirectory(workspaceId, "Plugin", "plugins", resolve(process.cwd(), ".storage", "plugins"), additions);
      if (source === "events") await this.ingestJsonDirectory(workspaceId, "Document", "events", resolve(process.cwd(), ".storage", "events"), additions);
    }

    const next = {
      nodes: [...snapshot.nodes, ...additions.nodes],
      edges: [...snapshot.edges, ...additions.edges],
      embeddings: [...snapshot.embeddings, ...additions.embeddings],
      provenance: [...snapshot.provenance, ...additions.provenance]
    };
    await this.store.write(next);
    await eventBus.publish({
      type: "knowledge.ingested",
      origin: "knowledge-graph",
      workspace_id: workspaceId,
      payload: { sources, entities: additions.nodes.length, relations: additions.edges.length, embeddings: additions.embeddings.length }
    });
    await executePluginHook("afterStrategy", { type: "knowledge_ingest", workspace_id: workspaceId, result: additions }, workspaceId);
    const duration = Math.round(performance.now() - started);
    recordDuration("phoenix_knowledge_graph_ingestion_ms", duration);
    logStructured("info", "knowledge_graph.ingestion.completed", { workspace_id: workspaceId, duration_ms: duration, sources: sources.join(","), entities: additions.nodes.length });

    return {
      status: "success",
      workspace_id: workspaceId,
      sources,
      entities: additions.nodes.length,
      relations: additions.edges.length,
      embeddings: additions.embeddings.length,
      provenance: additions.provenance.length
    };
  }

  private async ingestDocuments(workspaceId: string, additions: KnowledgeGraphSnapshot): Promise<void> {
    const base = await loadKnowledgeBase();
    for (const document of base.documents) {
      const text = `${document.category} ${document.id} ${JSON.stringify(document)}`;
      await this.addEntity(additions, {
        workspaceId,
        type: "Document",
        label: document.id,
        source: `knowledge/${document.category}/${document.id}`,
        text,
        metadata: { category: document.category, document }
      });
      const brandId = "brand:encanto-intenso";
      this.addNode(additions, brandId, "Brand", "Encanto Intenso", workspaceId, { inferred: true });
      this.addEdge(additions, brandId, `Document:${workspaceId}:${slug(document.id)}`, "references", workspaceId, { source: "documents" });
    }
  }

  private async ingestJsonDirectory(workspaceId: string, type: string, source: string, directory: string, additions: KnowledgeGraphSnapshot): Promise<void> {
    const files = await listJsonFiles(directory);
    for (const file of files.slice(0, 100)) {
      const content = await readFile(file, "utf8");
      const parsed = safeJson(content);
      const label = inferLabel(parsed, file);
      await this.addEntity(additions, { workspaceId, type, label, source, text: content.slice(0, 4000), metadata: { file: relative(file), source } });
    }
  }

  private async addEntity(additions: KnowledgeGraphSnapshot, input: { workspaceId: string; type: string; label: string; source: string; text: string; metadata: Record<string, unknown> }): Promise<void> {
    const entityId = `${input.type}:${input.workspaceId}:${slug(input.label)}`;
    this.addNode(additions, entityId, input.type, input.label, input.workspaceId, input.metadata);
    const embeddingStarted = performance.now();
    const vector = await withSpan("phoenix.knowledge_graph.embedding", {}, () => this.embeddingProvider.embed(input.text));
    recordDuration("phoenix_knowledge_graph_embedding_ms", Math.round(performance.now() - embeddingStarted));
    additions.embeddings.push({
      id: `embedding:${entityId}`,
      entity_id: entityId,
      workspace_id: input.workspaceId,
      text: input.text.slice(0, 1000),
      vector,
      source: input.source,
      created_at: new Date().toISOString()
    });
    additions.provenance.push({
      id: `provenance:${entityId}`,
      entity_id: entityId,
      document_id: entityId,
      workspace_id: input.workspaceId,
      source: input.source,
      chunk: input.text.slice(0, 800),
      score: 1,
      created_at: new Date().toISOString(),
      metadata: input.metadata
    });
  }

  private addNode(additions: KnowledgeGraphSnapshot, id: string, type: string, label: string, workspaceId: string, metadata: Record<string, unknown>): void {
    const now = new Date().toISOString();
    additions.nodes.push({ id, type, label, workspace_id: workspaceId, metadata, created_at: now, updated_at: now });
  }

  private addEdge(additions: KnowledgeGraphSnapshot, from: string, to: string, type: string, workspaceId: string, metadata: Record<string, unknown>): void {
    additions.edges.push({ id: `${type}:${from}->${to}`, from, to, type, workspace_id: workspaceId, weight: 1, metadata, created_at: new Date().toISOString() });
  }
}

async function listJsonFiles(directory: string): Promise<string[]> {
  let entries: Awaited<ReturnType<typeof readdir>> = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const results: string[] = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) results.push(...await listJsonFiles(path));
    if (entry.isFile() && entry.name.endsWith(".json")) results.push(path);
  }
  return results;
}

function safeJson(source: string): unknown {
  try {
    return JSON.parse(source);
  } catch {
    return {};
  }
}

function inferLabel(value: unknown, fallback: string): string {
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    for (const key of ["id", "execution_id", "event_id", "name", "title"]) {
      if (typeof object[key] === "string" && object[key]) return object[key];
    }
  }
  return fallback.split(/[\\/]/).pop()?.replace(/\.json$/, "") ?? randomUUID();
}

function slug(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || randomUUID();
}

function relative(path: string): string {
  return path.replace(`${process.cwd()}\\`, "").replace(`${process.cwd()}/`, "");
}
