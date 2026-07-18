export type ModelCapability =
  | "text"
  | "embeddings"
  | "vision"
  | "audio"
  | "tools"
  | "streaming"
  | "structured_json";

export type ModelTaskType = "agent" | "embedding" | "vision" | "audio" | "tool" | "general";
export type ModelRoutingPolicy = "lowest_cost" | "highest_quality" | "lowest_latency" | "preferred_model" | "fallback" | "task_affinity";

export type ModelUsage = {
  input: number;
  output: number;
  total: number;
};

export type ModelCost = {
  currency: "USD";
  estimated: number;
};

export type GenerationMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerationRequest = {
  task_type?: ModelTaskType;
  agent_id?: string;
  workspace_id?: string;
  messages: GenerationMessage[];
  temperature?: number;
  response_format?: "json" | "text";
  preferred_model?: string;
  policy?: ModelRoutingPolicy;
};

export type GenerationResponse = {
  content: string;
  output?: Record<string, unknown>;
  provider_id: string;
  model: string;
  usage: ModelUsage;
  cost: ModelCost;
  fallback: boolean;
  selection_reason: string;
};

export type EmbeddingRequest = {
  text: string;
  task_type?: ModelTaskType;
  workspace_id?: string;
  preferred_model?: string;
  policy?: ModelRoutingPolicy;
};

export type EmbeddingResponse = {
  vector: number[];
  provider_id: string;
  model: string;
  usage: ModelUsage;
  cost: ModelCost;
  fallback: boolean;
  selection_reason: string;
};

export type ProviderCapabilities = {
  text: boolean;
  embeddings: boolean;
  vision: boolean;
  audio: boolean;
  tools: boolean;
  max_context: number;
  streaming: boolean;
  structured_json: boolean;
};

export type ProviderHealth = {
  provider_id: string;
  available: boolean;
  configured: boolean;
  latency_ms: number;
  error_rate: number;
  last_checked_at: string;
  reason?: string;
};

export type ModelDescriptor = {
  id: string;
  provider_id: string;
  name: string;
  quality_score: number;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  latency_score: number;
  task_affinity: Partial<Record<ModelTaskType, number>>;
  capabilities: ProviderCapabilities;
};

export type ModelPolicy = {
  workspace_id: string;
  default_policy: ModelRoutingPolicy;
  fallback_order: string[];
  task_policies: Partial<Record<ModelTaskType, ModelRoutingPolicy>>;
  preferred_models: Partial<Record<ModelTaskType, string>>;
};

export type ModelSelection = {
  provider_id: string;
  model: ModelDescriptor;
  policy: ModelRoutingPolicy;
  reason: string;
};
