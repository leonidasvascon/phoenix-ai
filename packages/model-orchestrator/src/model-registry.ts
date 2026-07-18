import type { ModelDescriptor, ModelTaskType, ProviderCapabilities } from "./model-selection.ts";

const textCapabilities: ProviderCapabilities = {
  text: true,
  embeddings: false,
  vision: false,
  audio: false,
  tools: true,
  max_context: 128000,
  streaming: true,
  structured_json: true
};

const embeddingCapabilities: ProviderCapabilities = {
  ...textCapabilities,
  embeddings: true,
  max_context: 8192
};

const localCapabilities: ProviderCapabilities = {
  text: true,
  embeddings: true,
  vision: false,
  audio: false,
  tools: false,
  max_context: 32768,
  streaming: true,
  structured_json: true
};

export const defaultModels: ModelDescriptor[] = [
  model("openai:gpt-4.1-mini", "openai", "gpt-4.1-mini", 94, 0.0004, 0.0016, 88, embeddingCapabilities, { agent: 95, general: 92, embedding: 90 }),
  model("anthropic:claude-sonnet", "anthropic", "claude-sonnet", 96, 0.003, 0.015, 82, textCapabilities, { agent: 94, general: 96 }),
  model("google:gemini-flash", "google", "gemini-flash", 91, 0.00035, 0.00105, 92, embeddingCapabilities, { agent: 88, general: 90, embedding: 86 }),
  model("azure-openai:gpt-4.1-mini", "azure-openai", "gpt-4.1-mini", 94, 0.00045, 0.0018, 86, embeddingCapabilities, { agent: 94, general: 92, embedding: 90 }),
  model("ollama:local", "ollama", "local", 82, 0, 0, 75, localCapabilities, { agent: 78, general: 80, embedding: 82 })
];

export class ModelRegistry {
  private readonly models = new Map(defaultModels.map((item) => [item.id, item]));

  list(): ModelDescriptor[] {
    return [...this.models.values()];
  }

  find(id: string): ModelDescriptor | undefined {
    return this.models.get(id) ?? this.list().find((model) => model.name === id);
  }

  forProvider(providerId: string): ModelDescriptor[] {
    return this.list().filter((model) => model.provider_id === providerId);
  }

  forTask(taskType: ModelTaskType): ModelDescriptor[] {
    const capability = taskType === "embedding" ? "embeddings" : taskType === "audio" ? "audio" : taskType === "vision" ? "vision" : "text";
    return this.list().filter((item) => item.capabilities[capability]);
  }
}

function model(
  id: string,
  providerId: string,
  name: string,
  qualityScore: number,
  inputCost: number,
  outputCost: number,
  latencyScore: number,
  capabilities: ProviderCapabilities,
  taskAffinity: Partial<Record<ModelTaskType, number>>
): ModelDescriptor {
  return {
    id,
    provider_id: providerId,
    name,
    quality_score: qualityScore,
    cost_per_1k_input: inputCost,
    cost_per_1k_output: outputCost,
    latency_score: latencyScore,
    task_affinity: taskAffinity,
    capabilities
  };
}
