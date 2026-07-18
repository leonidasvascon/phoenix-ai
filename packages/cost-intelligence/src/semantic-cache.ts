import { createHash, randomUUID } from "node:crypto";
import { costPath, readJsonDirectory, writeJson, clearDirectory } from "./storage.ts";
import type { CostUsageKind, SemanticCacheEntry } from "./types.ts";

export class SemanticCache {
  private readonly threshold: number;

  constructor(threshold = Number(process.env.PHOENIX_SEMANTIC_CACHE_THRESHOLD ?? 0.92)) {
    this.threshold = threshold;
  }

  async lookup(input: { workspace_id?: string; text: string; embedding: number[]; kind?: CostUsageKind }): Promise<{ hit: boolean; entry?: SemanticCacheEntry; similarity: number }> {
    const workspaceId = input.workspace_id ?? "default-workspace";
    const entries = await this.list();
    const candidates = entries
      .filter((entry) => entry.workspace_id === workspaceId && entry.kind === (input.kind ?? "text"))
      .map((entry) => ({ entry, similarity: cosine(input.embedding, entry.embedding) }))
      .sort((a, b) => b.similarity - a.similarity);
    const best = candidates[0];
    if (best && best.similarity >= this.threshold) {
      const next = { ...best.entry, hits: best.entry.hits + 1, updated_at: new Date().toISOString() };
      await writeJson(costPath("cache", `${next.id}.json`), next);
      return { hit: true, entry: next, similarity: best.similarity };
    }
    return { hit: false, similarity: best?.similarity ?? 0 };
  }

  async store(input: { workspace_id?: string; provider: string; model: string; kind?: CostUsageKind; text: string; embedding: number[]; metadata?: Record<string, unknown>; estimated_savings?: number }): Promise<SemanticCacheEntry> {
    const id = hash(input.text);
    const entry: SemanticCacheEntry = {
      id,
      workspace_id: input.workspace_id ?? "default-workspace",
      provider: input.provider,
      model: input.model,
      kind: input.kind ?? "text",
      embedding: input.embedding,
      response_ref: `cache:${id}`,
      metadata: input.metadata ?? {},
      hits: 0,
      estimated_savings: input.estimated_savings ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await writeJson(costPath("cache", `${entry.id || randomUUID()}.json`), entry);
    return entry;
  }

  async list(): Promise<SemanticCacheEntry[]> {
    return readJsonDirectory<SemanticCacheEntry>(costPath("cache"));
  }

  async clear(): Promise<{ status: "success"; cleared: true }> {
    await clearDirectory(costPath("cache"));
    return { status: "success", cleared: true };
  }
}

export function hashEmbedding(text: string): number[] {
  const buckets = new Array(32).fill(0) as number[];
  for (const token of text.toLowerCase().split(/[^a-z0-9\u00c0-\u017f]+/).filter(Boolean)) {
    let hashValue = 0;
    for (const char of token) hashValue = ((hashValue << 5) - hashValue + char.charCodeAt(0)) | 0;
    buckets[Math.abs(hashValue) % buckets.length] += 1;
  }
  const magnitude = Math.sqrt(buckets.reduce((sum, value) => sum + value * value, 0)) || 1;
  return buckets.map((value) => Number((value / magnitude).toFixed(6)));
}

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 32);
}

function cosine(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let left = 0;
  let right = 0;
  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    left += a[index] * a[index];
    right += b[index] * b[index];
  }
  return left && right ? Number((dot / (Math.sqrt(left) * Math.sqrt(right))).toFixed(6)) : 0;
}
