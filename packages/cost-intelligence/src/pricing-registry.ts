import { costPath, readJson, writeJson } from "./storage.ts";
import type { PricingEntry } from "./types.ts";

export const defaultPricing: PricingEntry[] = [
  price("openai", "gpt-4.1-mini", "text", 0.0004, 0.0016, 0, 0, 0, 0),
  price("anthropic", "claude-sonnet", "text", 0.003, 0.015, 0, 0, 0, 0),
  price("google", "gemini-flash", "text", 0.00035, 0.00105, 0, 0, 0, 0),
  price("azure-openai", "gpt-4.1-mini", "text", 0.00045, 0.0018, 0, 0, 0, 0),
  price("ollama", "local", "text", 0, 0, 0, 0, 0, 0),
  price("mock", "mock-model", "text", 0, 0, 0, 0, 0, 0),
  price("mock", "mock-embedding", "embedding", 0, 0, 0, 0, 0, 0)
];

export class PricingRegistry {
  private readonly path: string;

  constructor(path = costPath("pricing", "pricing.json")) {
    this.path = path;
  }

  async list(): Promise<PricingEntry[]> {
    const entries = await readJson<PricingEntry[]>(this.path, []);
    if (entries.length) return entries;
    await this.save(defaultPricing);
    return defaultPricing;
  }

  async save(entries: PricingEntry[]): Promise<void> {
    await writeJson(this.path, entries);
  }

  async find(provider: string, model: string, kind: PricingEntry["kind"]): Promise<PricingEntry> {
    const entries = await this.list();
    return entries.find((entry) => entry.provider === provider && entry.model === model && entry.kind === kind)
      ?? entries.find((entry) => entry.provider === provider && entry.kind === kind)
      ?? defaultPricing[defaultPricing.length - 1];
  }
}

function price(provider: string, model: string, kind: PricingEntry["kind"], input: number, output: number, embedding: number, image: number, audio: number, video: number): PricingEntry {
  return {
    provider,
    model,
    kind,
    effective_from: "2026-07-18",
    currency: "USD",
    input_per_1k: input,
    output_per_1k: output,
    embedding_per_1k: embedding,
    image_unit: image,
    audio_per_minute: audio,
    video_per_second: video
  };
}
