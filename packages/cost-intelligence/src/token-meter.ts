import { randomUUID } from "node:crypto";
import { incrementCounter, logStructured, recordGauge } from "@phoenix-ai/observability";
import { calculateCost } from "./cost-calculator.ts";
import { PricingRegistry } from "./pricing-registry.ts";
import { costPath, readJsonDirectory, writeJson } from "./storage.ts";
import type { CostUsageKind, CostUsageRecord, TokenUsageInput } from "./types.ts";

export class TokenMeter {
  private readonly pricing: PricingRegistry;

  constructor(pricing = new PricingRegistry()) {
    this.pricing = pricing;
  }

  async record(input: {
    workspace_id?: string;
    trace_id?: string;
    provider: string;
    model: string;
    kind?: CostUsageKind;
    tokens: TokenUsageInput;
    duration_ms?: number;
    cache_hit?: boolean;
    policy?: string;
    user_id?: string;
    api_key_id?: string;
    workflow_id?: string;
    plugin_id?: string;
    images?: number;
    audio_seconds?: number;
    video_seconds?: number;
  }): Promise<CostUsageRecord> {
    const kind = input.kind ?? "text";
    const pricing = await this.pricing.find(input.provider, input.model, kind);
    const cost = calculateCost({
      pricing,
      kind,
      tokens: input.tokens,
      images: input.images,
      audio_seconds: input.audio_seconds,
      video_seconds: input.video_seconds
    });
    const record: CostUsageRecord = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      trace_id: input.trace_id,
      workspace_id: input.workspace_id ?? "default-workspace",
      user_id: input.user_id,
      api_key_id: input.api_key_id,
      workflow_id: input.workflow_id,
      plugin_id: input.plugin_id,
      provider: input.provider,
      model: input.model,
      kind,
      input_tokens: input.tokens.input,
      output_tokens: input.tokens.output,
      total_tokens: input.tokens.total,
      embeddings: input.tokens.embeddings ?? 0,
      images: input.images ?? 0,
      audio_seconds: input.audio_seconds ?? 0,
      video_seconds: input.video_seconds ?? 0,
      duration_ms: input.duration_ms ?? 0,
      estimated_cost: cost,
      consolidated_cost: cost,
      cache_hit: input.cache_hit ?? false,
      policy: input.policy
    };
    await writeJson(costPath("usage", `${record.id}.json`), record);
    incrementCounter("phoenix_cost_usage_records_total", { provider: record.provider, model: record.model, kind: record.kind });
    recordGauge("phoenix_cost_estimated_usd", record.estimated_cost, { provider: record.provider, model: record.model, kind: record.kind });
    logStructured("info", "cost.usage.recorded", { id: record.id, trace_id: record.trace_id, workspace_id: record.workspace_id, provider: record.provider, model: record.model, kind: record.kind, tokens: record.total_tokens, estimated_cost: record.estimated_cost, cache_hit: record.cache_hit });
    return record;
  }

  async list(): Promise<CostUsageRecord[]> {
    return readJsonDirectory<CostUsageRecord>(costPath("usage"));
  }
}
