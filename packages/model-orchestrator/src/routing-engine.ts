import { ModelRegistry } from "./model-registry.ts";
import { PolicyEngine } from "./policy-engine.ts";
import type { ModelDescriptor, ModelPolicy, ModelRoutingPolicy, ModelSelection, ModelTaskType } from "./model-selection.ts";

export class RoutingEngine {
  private readonly models: ModelRegistry;
  private readonly policies: PolicyEngine;

  constructor(models = new ModelRegistry(), policies = new PolicyEngine()) {
    this.models = models;
    this.policies = policies;
  }

  async select(input: { task_type?: ModelTaskType; workspace_id?: string; preferred_model?: string; policy?: ModelRoutingPolicy }): Promise<ModelSelection> {
    const taskType = input.task_type ?? "general";
    const policy = await this.policies.getPolicy(input.workspace_id);
    const effectivePolicy = input.policy ?? this.policies.resolvePolicy(policy, taskType);
    const candidates = orderCandidates(this.models.forTask(taskType), effectivePolicy, taskType, policy, input.preferred_model);
    const model = candidates[0] ?? this.models.list()[0];
    return {
      provider_id: model.provider_id,
      model,
      policy: effectivePolicy,
      reason: reasonFor(effectivePolicy, model, taskType)
    };
  }
}

function orderCandidates(candidates: ModelDescriptor[], policy: ModelRoutingPolicy, taskType: ModelTaskType, modelPolicy: ModelPolicy, preferredModel?: string): ModelDescriptor[] {
  const preferred = preferredModel ?? modelPolicy.preferred_models[taskType];
  if (policy === "preferred_model" && preferred) return [...candidates].sort((a) => a.id === preferred || a.name === preferred ? -1 : 1);
  if (policy === "lowest_cost") return [...candidates].sort((a, b) => (a.cost_per_1k_input + a.cost_per_1k_output) - (b.cost_per_1k_input + b.cost_per_1k_output));
  if (policy === "highest_quality") return [...candidates].sort((a, b) => b.quality_score - a.quality_score);
  if (policy === "lowest_latency") return [...candidates].sort((a, b) => b.latency_score - a.latency_score);
  if (policy === "task_affinity") return [...candidates].sort((a, b) => (b.task_affinity[taskType] ?? 0) - (a.task_affinity[taskType] ?? 0));
  const order = new Map(modelPolicy.fallback_order.map((provider, index) => [provider, index]));
  return [...candidates].sort((a, b) => (order.get(a.provider_id) ?? 999) - (order.get(b.provider_id) ?? 999));
}

function reasonFor(policy: ModelRoutingPolicy, model: ModelDescriptor, taskType: ModelTaskType): string {
  if (policy === "task_affinity") return `${model.name} selected for ${taskType} affinity.`;
  if (policy === "lowest_cost") return `${model.name} selected by lowest estimated cost.`;
  if (policy === "highest_quality") return `${model.name} selected by quality score.`;
  if (policy === "lowest_latency") return `${model.name} selected by latency score.`;
  if (policy === "preferred_model") return `${model.name} selected as preferred model.`;
  return `${model.name} selected from fallback order.`;
}
