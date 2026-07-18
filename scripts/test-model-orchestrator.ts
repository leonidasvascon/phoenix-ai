import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { createDefaultModelOrchestrator, PolicyEngine } from "@phoenix-ai/model-orchestrator";

await rm(resolve(process.cwd(), ".storage", "models"), { recursive: true, force: true });

const policies = new PolicyEngine();
const policy = await policies.updatePolicy({
  workspace_id: "default-workspace",
  default_policy: "fallback",
  fallback_order: ["openai", "anthropic", "google", "azure-openai", "ollama", "mock"],
  task_policies: { agent: "task_affinity", embedding: "lowest_cost" }
});

assert.equal(policy.fallback_order[0], "openai", "policy should preserve fallback order");

const orchestrator = createDefaultModelOrchestrator();
const models = orchestrator.listModels();
assert(models.length >= 5, "orchestrator should register multiple model families");

const generation = await orchestrator.generate({
  task_type: "agent",
  agent_id: "hook_specialist",
  response_format: "json",
  messages: [
    { role: "system", content: "Return JSON." },
    { role: "user", content: "Create a hook." }
  ]
});

assert.equal(generation.provider_id, "mock", "unconfigured providers should fall back to mock");
assert.equal(generation.fallback, true, "fallback should be recorded");
assert(generation.output && "hook" in generation.output, "agent generation should return JSON output");

const embedding = await orchestrator.embed({ text: "saudade desejo silencio", task_type: "embedding" });
assert.equal(embedding.vector.length, 32, "embedding should return normalized vector");

const health = await orchestrator.health();
assert(health.some((provider) => provider.provider_id === "openai"), "health should include OpenAI");
assert(health.some((provider) => provider.provider_id === "mock" && provider.available), "health should include available mock provider");

console.log(JSON.stringify({
  status: "pass",
  models: models.length,
  generation_provider: generation.provider_id,
  embedding_provider: embedding.provider_id,
  health_checks: health.length
}, null, 2));
