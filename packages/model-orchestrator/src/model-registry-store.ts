import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { defaultModels } from "./model-registry.ts";

export async function persistProviderCatalog(path = resolve(process.cwd(), ".storage", "models", "providers.json")): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(defaultModels.map((model) => ({
    id: model.provider_id,
    model: model.name,
    capabilities: model.capabilities,
    quality_score: model.quality_score,
    cost_per_1k_input: model.cost_per_1k_input,
    cost_per_1k_output: model.cost_per_1k_output,
    latency_score: model.latency_score
  })), null, 2)}\n`);
}
