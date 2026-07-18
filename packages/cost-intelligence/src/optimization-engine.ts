export type OptimizationDecision = {
  policy: string;
  recommendation: string;
  target_model?: string;
  reduce_context: boolean;
  use_cache: boolean;
};

export class OptimizationEngine {
  decide(input: { task_type?: string; expected_score?: number; draft?: boolean; local_available?: boolean }): OptimizationDecision {
    if (input.draft) {
      return { policy: "draft_low_cost", recommendation: "Use cheapest capable model for draft generation.", target_model: "ollama:local", reduce_context: true, use_cache: true };
    }
    if ((input.expected_score ?? 0) > 95) {
      return { policy: "premium_high_value", recommendation: "Premium model is allowed for high expected score work.", target_model: "anthropic:claude-sonnet", reduce_context: false, use_cache: true };
    }
    if (input.local_available) {
      return { policy: "local_when_available", recommendation: "Use local model when available to control spend.", target_model: "ollama:local", reduce_context: true, use_cache: true };
    }
    return { policy: "balanced", recommendation: "Use task affinity with semantic cache.", reduce_context: true, use_cache: true };
  }
}
