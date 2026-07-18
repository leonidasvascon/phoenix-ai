import { buildCapabilityMatrix, createDefaultModelOrchestrator, defaultPolicy, persistProviderCatalog, PolicyEngine } from "@phoenix-ai/model-orchestrator";
import type { GenerationRequest, ModelPolicy } from "@phoenix-ai/model-orchestrator";

const policies = new PolicyEngine();

export async function listModels() {
  const orchestrator = createDefaultModelOrchestrator();
  await persistProviderCatalog();
  return {
    models: orchestrator.listModels(),
    capability_matrix: buildCapabilityMatrix(),
    active_policy: await policies.getPolicy()
  };
}

export function listModelProviders() {
  return createDefaultModelOrchestrator().listProviders();
}

export async function getModelHealth() {
  return createDefaultModelOrchestrator().health();
}

export async function getModelPolicies() {
  return policies.listPolicies();
}

export async function updateModelPolicy(input: Partial<ModelPolicy>) {
  return policies.updatePolicy(input);
}

export async function testModel(input: Partial<GenerationRequest> = {}) {
  const response = await createDefaultModelOrchestrator().generate({
    task_type: input.task_type ?? "general",
    workspace_id: input.workspace_id ?? "default-workspace",
    policy: input.policy,
    preferred_model: input.preferred_model,
    response_format: input.response_format ?? "json",
    messages: input.messages?.length ? input.messages : [
      { role: "system", content: "You are a Phoenix AI model readiness test. Return JSON." },
      { role: "user", content: "Return {\"status\":\"ok\"}." }
    ]
  });
  return {
    status: "success",
    provider_id: response.provider_id,
    model: response.model,
    fallback: response.fallback,
    selection_reason: response.selection_reason,
    usage: response.usage,
    cost: response.cost,
    output: response.output ?? { content: response.content }
  };
}

export function getDefaultModelPolicy() {
  return defaultPolicy;
}
