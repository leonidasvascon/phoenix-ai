export type CostUsageKind = "text" | "embedding" | "image" | "audio" | "video";
export type BudgetScope = "workspace" | "user" | "api_key" | "workflow" | "plugin";
export type BudgetState = "normal" | "warning" | "exceeded" | "blocked";

export type TokenUsageInput = {
  input: number;
  output: number;
  total: number;
  embeddings?: number;
};

export type CostUsageRecord = {
  id: string;
  timestamp: string;
  trace_id?: string;
  workspace_id: string;
  user_id?: string;
  api_key_id?: string;
  workflow_id?: string;
  plugin_id?: string;
  provider: string;
  model: string;
  kind: CostUsageKind;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  embeddings: number;
  images: number;
  audio_seconds: number;
  video_seconds: number;
  duration_ms: number;
  estimated_cost: number;
  consolidated_cost: number;
  cache_hit: boolean;
  policy?: string;
};

export type PricingEntry = {
  provider: string;
  model: string;
  kind: CostUsageKind;
  effective_from: string;
  currency: "USD";
  input_per_1k: number;
  output_per_1k: number;
  embedding_per_1k: number;
  image_unit: number;
  audio_per_minute: number;
  video_per_second: number;
};

export type Budget = {
  id: string;
  scope: BudgetScope;
  scope_id: string;
  workspace_id: string;
  period: "daily" | "monthly";
  amount: number;
  currency: "USD";
  warning_threshold: number;
  state: BudgetState;
  spent: number;
  remaining: number;
  updated_at: string;
};

export type Quota = {
  id: string;
  workspace_id: string;
  requests_per_minute: number;
  tokens_per_hour: number;
  daily_cost: number;
  monthly_cost: number;
  updated_at: string;
};

export type SemanticCacheEntry = {
  id: string;
  workspace_id: string;
  provider: string;
  model: string;
  kind: CostUsageKind;
  embedding: number[];
  response_ref: string;
  metadata: Record<string, unknown>;
  hits: number;
  estimated_savings: number;
  created_at: string;
  updated_at: string;
};

export type CostReport = {
  total_cost: number;
  total_tokens: number;
  requests: number;
  cache_hits: number;
  cache_savings: number;
  by_provider: Record<string, number>;
  by_model: Record<string, number>;
  budgets: Budget[];
  quotas: Quota[];
  alerts: Array<{ level: "info" | "warning" | "critical"; message: string; scope_id?: string }>;
};
