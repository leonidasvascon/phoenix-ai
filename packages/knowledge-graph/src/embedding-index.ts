export type EmbeddingProvider = {
  id: string;
  embed(text: string): Promise<number[]>;
};

export type EmbeddingRecord = {
  id: string;
  entity_id: string;
  workspace_id: string;
  text: string;
  vector: number[];
  source: string;
  created_at: string;
};

export class HashEmbeddingProvider implements EmbeddingProvider {
  readonly id = "hash";

  async embed(text: string): Promise<number[]> {
    const buckets = new Array(32).fill(0) as number[];
    const tokens = text.toLowerCase().split(/[^a-z0-9\u00c0-\u017f]+/).filter(Boolean);

    for (const token of tokens) {
      let hash = 0;
      for (const char of token) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
      buckets[Math.abs(hash) % buckets.length] += 1;
    }

    const magnitude = Math.sqrt(buckets.reduce((sum, value) => sum + value * value, 0)) || 1;
    return buckets.map((value) => Number((value / magnitude).toFixed(6)));
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    aMagnitude += a[index] * a[index];
    bMagnitude += b[index] * b[index];
  }

  if (!aMagnitude || !bMagnitude) return 0;
  return Number((dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude))).toFixed(6));
}
