import type { ModelSelection, ModelTaskType } from "./model-selection.ts";
import { ModelRegistry } from "./model-registry.ts";
import { PolicyEngine } from "./policy-engine.ts";

export class FallbackEngine {
  private readonly models: ModelRegistry;
  private readonly policies: PolicyEngine;

  constructor(models = new ModelRegistry(), policies = new PolicyEngine()) {
    this.models = models;
    this.policies = policies;
  }

  async fallbackChain(input: { workspace_id?: string; task_type?: ModelTaskType; initial?: ModelSelection }): Promise<ModelSelection[]> {
    const taskType = input.task_type ?? "general";
    const policy = await this.policies.getPolicy(input.workspace_id);
    const order = new Map(policy.fallback_order.map((provider, index) => [provider, index]));
    return this.models.forTask(taskType)
      .filter((model) => model.provider_id !== input.initial?.provider_id)
      .sort((a, b) => (order.get(a.provider_id) ?? 999) - (order.get(b.provider_id) ?? 999))
      .map((model) => ({ provider_id: model.provider_id, model, policy: "fallback", reason: `${model.name} selected as fallback.` }));
  }
}
