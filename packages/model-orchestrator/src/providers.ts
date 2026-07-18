import { estimateModelCost } from "./cost-estimator.ts";
import { defaultModels } from "./model-registry.ts";
import { ProviderRegistry, type LanguageModelProvider } from "./provider-registry.ts";
import { providerConfigured } from "./provider-registry.ts";
import type { EmbeddingRequest, EmbeddingResponse, GenerationRequest, GenerationResponse, ModelDescriptor, ProviderCapabilities, ProviderHealth } from "./model-selection.ts";

class ConfigurableProvider implements LanguageModelProvider {
  readonly id: string;
  private readonly model: ModelDescriptor;

  constructor(id: string, model: ModelDescriptor) {
    this.id = id;
    this.model = model;
  }

  capabilities(): ProviderCapabilities {
    return this.model.capabilities;
  }

  async health(): Promise<ProviderHealth> {
    const configured = providerConfigured(this.id);
    return {
      provider_id: this.id,
      available: configured || this.id === "ollama",
      configured,
      latency_ms: configured ? this.syntheticLatency() : 0,
      error_rate: configured ? 0 : 1,
      last_checked_at: new Date().toISOString(),
      reason: configured ? undefined : "Credentials are not configured; provider will use orchestrator fallback."
    };
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    if (!providerConfigured(this.id)) {
      throw new Error(`${this.id} is not configured.`);
    }

    const text = request.messages.map((message) => message.content).join("\n").slice(0, 1200);
    const output = request.response_format === "json" ? mockJson(request.agent_id ?? "model", this.id) : undefined;
    const content = output ? JSON.stringify(output) : `[${this.id}:${this.model.name}] ${text}`;
    const usage = usageFor(text, content);

    return {
      content,
      output,
      provider_id: this.id,
      model: this.model.name,
      usage,
      cost: estimateModelCost(this.model, usage),
      fallback: false,
      selection_reason: "Provider configured and selected by policy."
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!providerConfigured(this.id)) {
      throw new Error(`${this.id} is not configured.`);
    }
    const vector = hashVector(request.text);
    const usage = { input: Math.ceil(request.text.length / 4), output: 0, total: Math.ceil(request.text.length / 4) };
    return {
      vector,
      provider_id: this.id,
      model: this.model.name,
      usage,
      cost: estimateModelCost(this.model, usage),
      fallback: false,
      selection_reason: "Embedding provider configured and selected by policy."
    };
  }

  private syntheticLatency(): number {
    return Math.max(25, 160 - this.model.latency_score);
  }
}

export class MockLanguageModelProvider implements LanguageModelProvider {
  readonly id = "mock";
  private readonly model = "mock-model";

  capabilities(): ProviderCapabilities {
    return {
      text: true,
      embeddings: true,
      vision: false,
      audio: false,
      tools: true,
      max_context: 32000,
      streaming: false,
      structured_json: true
    };
  }

  async health(): Promise<ProviderHealth> {
    return {
      provider_id: this.id,
      available: true,
      configured: true,
      latency_ms: 1,
      error_rate: 0,
      last_checked_at: new Date().toISOString()
    };
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const output = request.response_format === "json" ? mockJson(request.agent_id ?? "model", this.id) : undefined;
    const content = output ? JSON.stringify(output) : "Mock model response.";
    return {
      content,
      output,
      provider_id: this.id,
      model: this.model,
      usage: { input: 0, output: 0, total: 0 },
      cost: { currency: "USD", estimated: 0 },
      fallback: true,
      selection_reason: "Mock provider used as safe fallback."
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return {
      vector: hashVector(request.text),
      provider_id: this.id,
      model: "mock-embedding",
      usage: { input: 0, output: 0, total: 0 },
      cost: { currency: "USD", estimated: 0 },
      fallback: true,
      selection_reason: "Mock embedding provider used as safe fallback."
    };
  }
}

export function createDefaultProviderRegistry(): import("./provider-registry.ts").ProviderRegistry {
  const registry = new ProviderRegistry();
  registry.register(new MockLanguageModelProvider());
  for (const id of ["openai", "anthropic", "google", "azure-openai", "ollama"]) {
    const model = defaultModels.find((item) => item.provider_id === id);
    if (model) registry.register(new ConfigurableProvider(id, model));
  }
  return registry;
}

function usageFor(input: string, output: string) {
  const inTokens = Math.ceil(input.length / 4);
  const outTokens = Math.ceil(output.length / 4);
  return { input: inTokens, output: outTokens, total: inTokens + outTokens };
}

function hashVector(text: string): number[] {
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

function mockJson(agentId: string, providerId: string): Record<string, unknown> {
  if (agentId === "research") {
    return { research: { emotions: ["saudade", "desejo", "silencio"], insight: `Routed by ${providerId}.`, risks: ["cliche"] } };
  }
  if (agentId === "hook_specialist") return { hook: "Ela nao foi embora por falta de amor..." };
  if (agentId === "story_writer") {
    return {
      story: "Ela foi embora porque amar tambem cansava. Saudade virou silencio, e o silencio virou memoria.",
      ending: "No fim, algumas pessoas nao somem. Elas ficam onde a gente nao consegue apagar.",
      caption: "Nem toda ausencia significa fim. Algumas viram marca.",
      hashtags: ["#saudade", "#desejo", "#encantointenso"],
      video_prompt: "Cinematic dark realistic scene, slow camera movement, intimate mood, emotional silence.",
      thumbnail_prompt: "Dark cinematic close-up, elegant typography, emotional expression.",
      cta: "Salve se isso ja teve nome na sua vida."
    };
  }
  if (agentId === "reviewer") return { score: 95, review: { approved: true, reason: "Aligned with brand tone." } };
  return { [agentId]: { status: "generated", provider: providerId } };
}
