import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { KnowledgeEdge } from "./edge.ts";
import type { EmbeddingRecord } from "./embedding-index.ts";
import type { KnowledgeNode } from "./node.ts";
import type { KnowledgeProvenance } from "./provenance.ts";

export type KnowledgeGraphSnapshot = {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  embeddings: EmbeddingRecord[];
  provenance: KnowledgeProvenance[];
};

export class FileKnowledgeGraphStore {
  private readonly root: string;

  constructor(root = resolve(process.cwd(), ".storage", "knowledge")) {
    this.root = root;
  }

  async read(): Promise<KnowledgeGraphSnapshot> {
    const [nodes, edges, embeddings, provenance] = await Promise.all([
      this.readJson<KnowledgeNode[]>(resolve(this.root, "graph", "nodes.json"), []),
      this.readJson<KnowledgeEdge[]>(resolve(this.root, "graph", "edges.json"), []),
      this.readJson<EmbeddingRecord[]>(resolve(this.root, "embeddings", "index.json"), []),
      this.readJson<KnowledgeProvenance[]>(resolve(this.root, "provenance", "items.json"), [])
    ]);

    return { nodes, edges, embeddings, provenance };
  }

  async write(snapshot: KnowledgeGraphSnapshot): Promise<void> {
    await Promise.all([
      this.writeJson(resolve(this.root, "graph", "nodes.json"), dedupeBy(snapshot.nodes, "id")),
      this.writeJson(resolve(this.root, "graph", "edges.json"), dedupeBy(snapshot.edges, "id")),
      this.writeJson(resolve(this.root, "embeddings", "index.json"), dedupeBy(snapshot.embeddings, "id")),
      this.writeJson(resolve(this.root, "provenance", "items.json"), dedupeBy(snapshot.provenance, "id"))
    ]);
  }

  private async readJson<T>(path: string, fallback: T): Promise<T> {
    try {
      return JSON.parse(await readFile(path, "utf8")) as T;
    } catch {
      return fallback;
    }
  }

  private async writeJson(path: string, value: unknown): Promise<void> {
    await mkdir(resolve(path, ".."), { recursive: true });
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }
}

function dedupeBy<T extends Record<string, unknown>>(items: T[], key: keyof T): T[] {
  return Array.from(new Map(items.map((item) => [item[key], item])).values());
}
