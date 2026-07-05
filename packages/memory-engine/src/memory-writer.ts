import type { BrandMemory, MemoryStore, RecentOutput } from "./memory-store.ts";

export type MemoryWriteInput = {
  memory: BrandMemory;
  execution_id: string;
  theme: string;
  format: string;
  output: Record<string, unknown>;
  score: number;
  storytelling?: string[];
};

function appendUnique(values: string[], value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) {
    return values;
  }

  const normalized = value.trim();
  if (values.includes(normalized)) {
    return values;
  }

  return [...values, normalized];
}

function appendManyUnique(values: string[], nextValues: string[] = []): string[] {
  return nextValues.reduce((acc, value) => appendUnique(acc, value), values);
}

function trimRecentOutputs(outputs: RecentOutput[], limit = 25): RecentOutput[] {
  return outputs.slice(-limit);
}

export async function writeMemory(store: MemoryStore, input: MemoryWriteInput): Promise<BrandMemory> {
  const nextMemory: BrandMemory = {
    ...input.memory,
    used_hooks: appendUnique(input.memory.used_hooks, input.output.hook),
    used_themes: appendUnique(input.memory.used_themes, input.theme),
    used_ctas: appendUnique(input.memory.used_ctas, input.output.cta),
    used_storytelling: appendManyUnique(input.memory.used_storytelling, input.storytelling),
    recent_outputs: trimRecentOutputs([
      ...input.memory.recent_outputs,
      {
        execution_id: input.execution_id,
        theme: input.theme,
        format: input.format,
        hook: typeof input.output.hook === "string" ? input.output.hook : undefined,
        cta: typeof input.output.cta === "string" ? input.output.cta : undefined,
        score: input.score,
        created_at: new Date().toISOString()
      }
    ])
  };

  await store.write(nextMemory);

  return nextMemory;
}
