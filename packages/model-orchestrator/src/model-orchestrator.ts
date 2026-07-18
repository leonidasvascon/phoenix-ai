import { incrementCounter, logStructured, recordDuration, withSpan } from "@phoenix-ai/observability";
import { hashEmbedding, OptimizationEngine, QuotaService, SemanticCache, TokenMeter } from "@phoenix-ai/cost-intelligence";
import { FallbackEngine } from "./fallback-engine.ts";
import { HealthMonitor } from "./health-monitor.ts";
import { ModelRegistry } from "./model-registry.ts";
import { persistProviderCatalog } from "./model-registry-store.ts";
import { PolicyEngine } from "./policy-engine.ts";
import { ProviderRegistry } from "./provider-registry.ts";
import { createDefaultProviderRegistry } from "./providers.ts";
import { RoutingEngine } from "./routing-engine.ts";
import type { EmbeddingRequest, EmbeddingResponse, GenerationRequest, GenerationResponse, ModelSelection, ProviderHealth } from "./model-selection.ts";

export type ModelOrchestratorAuditEntry = {
  timestamp: string;
  task_type: string;
  requested_provider: string;
  effective_provider: string;
  model: string;
  policy: string;
  fallback: boolean;
  reason: string;
  duration_ms: number;
  cost_estimated: number;
};

export class ModelOrchestrator {
  private readonly providers: ProviderRegistry;
  private readonly models: ModelRegistry;
  private readonly routing: RoutingEngine;
  private readonly fallback: FallbackEngine;
  private readonly healthMonitor: HealthMonitor;
  private readonly tokenMeter = new TokenMeter();
  private readonly quotaService = new QuotaService();
  private readonly semanticCache = new SemanticCache();
  private readonly optimizer = new OptimizationEngine();
  private readonly auditEntries: ModelOrchestratorAuditEntry[] = [];

  constructor(options: { providers?: ProviderRegistry; models?: ModelRegistry; policies?: PolicyEngine } = {}) {
    this.providers = options.providers ?? createDefaultProviderRegistry();
    this.models = options.models ?? new ModelRegistry();
    const policies = options.policies ?? new PolicyEngine();
    this.routing = new RoutingEngine(this.models, policies);
    this.fallback = new FallbackEngine(this.models, policies);
    this.healthMonitor = new HealthMonitor(this.providers);
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    return withSpan("phoenix.model_orchestrator.generate", {
      "phoenix.model.task_type": request.task_type ?? "general",
      "phoenix.workspace.id": request.workspace_id ?? "default-workspace"
    }, async () => {
      const optimization = this.optimizer.decide({ task_type: request.task_type, draft: request.policy === "lowest_cost" });
      const quota = await this.quotaService.check(request.workspace_id ?? "default-workspace", await this.tokenMeter.list());
      if (!quota.allowed) throw new Error(`Model quota blocked request: ${quota.reason}`);
      const cacheText = request.messages.map((message) => `${message.role}:${message.content.length}`).join("|");
      const cache = await this.semanticCache.lookup({
        workspace_id: request.workspace_id,
        text: cacheText,
        embedding: hashEmbedding(cacheText),
        kind: "text"
      });
      const selection = await this.routing.select(request);
      const response = await this.tryGenerate(selection, request, false).catch(async (error) => {
        logStructured("warn", "model_orchestrator.primary_failed", {
          provider_id: selection.provider_id,
          model: selection.model.name,
          error: error instanceof Error ? error.message : "Unknown model provider error."
        });
        for (const next of await this.fallback.fallbackChain({ workspace_id: request.workspace_id, task_type: request.task_type, initial: selection })) {
          try {
            return await this.tryGenerate(next, request, true);
          } catch {
            continue;
          }
        }
        return this.tryGenerate({ provider_id: "mock", model: this.models.find("ollama:local") ?? selection.model, policy: "fallback", reason: "All configured providers failed; mock fallback used." }, request, true);
      });
      await this.semanticCache.store({
        workspace_id: request.workspace_id,
        provider: response.provider_id,
        model: response.model,
        kind: "text",
        text: cacheText,
        embedding: hashEmbedding(cacheText),
        metadata: { task_type: request.task_type ?? "general", policy: selection.policy, optimization: optimization.policy },
        estimated_savings: cache.hit ? response.cost.estimated : 0
      });
      await this.tokenMeter.record({
        workspace_id: request.workspace_id,
        provider: response.provider_id,
        model: response.model,
        kind: "text",
        tokens: response.usage,
        cache_hit: cache.hit,
        policy: selection.policy
      });
      return response;
    });
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return withSpan("phoenix.model_orchestrator.embed", {
      "phoenix.model.task_type": "embedding",
      "phoenix.workspace.id": request.workspace_id ?? "default-workspace"
    }, async () => {
      const selection = await this.routing.select({ ...request, task_type: "embedding" });
      const quota = await this.quotaService.check(request.workspace_id ?? "default-workspace", await this.tokenMeter.list());
      if (!quota.allowed) throw new Error(`Embedding quota blocked request: ${quota.reason}`);
      const cache = await this.semanticCache.lookup({
        workspace_id: request.workspace_id,
        text: `embedding:${request.text.length}`,
        embedding: hashEmbedding(request.text),
        kind: "embedding"
      });
      const response = await this.tryEmbed(selection, request, false).catch(async () => {
        for (const next of await this.fallback.fallbackChain({ workspace_id: request.workspace_id, task_type: "embedding", initial: selection })) {
          try {
            return await this.tryEmbed(next, request, true);
          } catch {
            continue;
          }
        }
        return this.tryEmbed({ provider_id: "mock", model: this.models.find("ollama:local") ?? selection.model, policy: "fallback", reason: "All embedding providers failed; mock fallback used." }, request, true);
      });
      await this.semanticCache.store({
        workspace_id: request.workspace_id,
        provider: response.provider_id,
        model: response.model,
        kind: "embedding",
        text: `embedding:${request.text.length}`,
        embedding: response.vector,
        metadata: { task_type: "embedding", policy: selection.policy },
        estimated_savings: cache.hit ? response.cost.estimated : 0
      });
      await this.tokenMeter.record({
        workspace_id: request.workspace_id,
        provider: response.provider_id,
        model: response.model,
        kind: "embedding",
        tokens: { ...response.usage, embeddings: response.usage.input },
        cache_hit: cache.hit,
        policy: selection.policy
      });
      return response;
    });
  }

  listModels() {
    return this.models.list();
  }

  listProviders() {
    return this.providers.list().map((provider) => ({ id: provider.id, capabilities: provider.capabilities() }));
  }

  async health(): Promise<ProviderHealth[]> {
    await persistProviderCatalog();
    return this.healthMonitor.checkAll();
  }

  audit(): ModelOrchestratorAuditEntry[] {
    return [...this.auditEntries].slice(-100);
  }

  private async tryGenerate(selection: ModelSelection, request: GenerationRequest, fallback: boolean): Promise<GenerationResponse> {
    const started = performance.now();
    const provider = this.providers.get(selection.provider_id) ?? this.providers.get("mock");
    if (!provider) throw new Error("No model provider available.");
    const response = await provider.generate(request);
    const duration = Math.round(performance.now() - started);
    const result = { ...response, fallback, selection_reason: fallback ? `${selection.reason} Fallback was required.` : selection.reason };
    this.record({ selection, requestType: request.task_type ?? "general", response: result, duration, fallback });
    return result;
  }

  private async tryEmbed(selection: ModelSelection, request: EmbeddingRequest, fallback: boolean): Promise<EmbeddingResponse> {
    const started = performance.now();
    const provider = this.providers.get(selection.provider_id) ?? this.providers.get("mock");
    if (!provider?.embed) throw new Error(`${selection.provider_id} does not support embeddings.`);
    const response = await provider.embed(request);
    const duration = Math.round(performance.now() - started);
    const result = { ...response, fallback, selection_reason: fallback ? `${selection.reason} Fallback was required.` : selection.reason };
    this.record({ selection, requestType: "embedding", response: result, duration, fallback });
    return result;
  }

  private record(input: { selection: ModelSelection; requestType: string; response: GenerationResponse | EmbeddingResponse; duration: number; fallback: boolean }): void {
    const entry = {
      timestamp: new Date().toISOString(),
      task_type: input.requestType,
      requested_provider: input.selection.provider_id,
      effective_provider: input.response.provider_id,
      model: input.response.model,
      policy: input.selection.policy,
      fallback: input.fallback,
      reason: input.response.selection_reason,
      duration_ms: input.duration,
      cost_estimated: input.response.cost.estimated
    };
    this.auditEntries.push(entry);
    recordDuration("phoenix_model_response_duration_ms", input.duration, {
      provider: entry.effective_provider,
      model: entry.model,
      task_type: entry.task_type
    });
    incrementCounter("phoenix_model_requests_total", {
      provider: entry.effective_provider,
      model: entry.model,
      task_type: entry.task_type,
      fallback: String(entry.fallback)
    });
    logStructured("info", "model_orchestrator.selection.completed", entry);
  }
}

let singleton: ModelOrchestrator | undefined;

export function createDefaultModelOrchestrator(): ModelOrchestrator {
  singleton ??= new ModelOrchestrator();
  return singleton;
}
