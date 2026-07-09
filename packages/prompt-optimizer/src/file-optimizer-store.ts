import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { OptimizerStore, PromptOptimization } from "./optimizer-store.ts";

export class FileOptimizerStore implements OptimizerStore {
  private readonly storagePath: string;

  constructor(storagePath = resolve(process.cwd(), ".storage", "prompt-optimizations.json")) {
    this.storagePath = storagePath;
  }

  async list(): Promise<PromptOptimization[]> {
    try {
      const source = await readFile(this.storagePath, "utf8");
      const parsed = JSON.parse(source) as unknown;

      return Array.isArray(parsed) ? parsed.filter(isPromptOptimization) : [];
    } catch {
      return [];
    }
  }

  async saveAll(optimizations: PromptOptimization[]): Promise<void> {
    await mkdir(dirname(this.storagePath), { recursive: true });
    await writeFile(this.storagePath, `${JSON.stringify(optimizations, null, 2)}\n`, "utf8");
  }
}

function isPromptOptimization(value: unknown): value is PromptOptimization {
  if (!value || typeof value !== "object") return false;

  const optimization = value as PromptOptimization;

  return Boolean(
    optimization.id &&
      optimization.brand_id &&
      optimization.agent &&
      optimization.instruction &&
      optimization.source &&
      typeof optimization.active === "boolean" &&
      optimization.created_at
  );
}
