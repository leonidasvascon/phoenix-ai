import type { ModelCost, ModelDescriptor, ModelUsage } from "./model-selection.ts";

export function estimateModelCost(model: ModelDescriptor, usage: ModelUsage): ModelCost {
  return {
    currency: "USD",
    estimated: Number((((usage.input / 1000) * model.cost_per_1k_input) + ((usage.output / 1000) * model.cost_per_1k_output)).toFixed(6))
  };
}
