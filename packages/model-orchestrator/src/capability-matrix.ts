import { ModelRegistry } from "./model-registry.ts";
import type { ModelCapability, ModelDescriptor } from "./model-selection.ts";

export type CapabilityMatrixEntry = {
  provider_id: string;
  model: string;
  capabilities: ModelDescriptor["capabilities"];
};

export function buildCapabilityMatrix(registry = new ModelRegistry()): CapabilityMatrixEntry[] {
  return registry.list().map((model) => ({
    provider_id: model.provider_id,
    model: model.name,
    capabilities: model.capabilities
  }));
}

export function hasCapability(model: ModelDescriptor, capability: ModelCapability): boolean {
  if (capability === "structured_json") return model.capabilities.structured_json;
  if (capability === "max_context") return model.capabilities.max_context > 0;
  return Boolean(model.capabilities[capability]);
}
