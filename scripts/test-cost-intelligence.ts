import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { BudgetService, CostReportingService, hashEmbedding, PricingRegistry, QuotaService, SemanticCache, TokenMeter } from "@phoenix-ai/cost-intelligence";

await rm(resolve(process.cwd(), ".storage", "cost"), { recursive: true, force: true });

const pricing = await new PricingRegistry().list();
assert(pricing.some((entry) => entry.provider === "openai"), "pricing registry should include OpenAI");

const meter = new TokenMeter();
const first = await meter.record({
  workspace_id: "cost-test-workspace",
  trace_id: "cost-test-trace",
  provider: "openai",
  model: "gpt-4.1-mini",
  kind: "text",
  tokens: { input: 1000, output: 500, total: 1500 },
  duration_ms: 120,
  policy: "lowest_cost"
});
assert(first.estimated_cost > 0, "usage should estimate cost");

const budget = await new BudgetService().update({ workspace_id: "cost-test-workspace", amount: 0.001, warning_threshold: 0.5 });
assert.equal(budget.workspace_id, "cost-test-workspace", "budget should be configurable");

const quota = await new QuotaService().update({ workspace_id: "cost-test-workspace", requests_per_minute: 10, tokens_per_hour: 5000, daily_cost: 1 });
const quotaCheck = await new QuotaService().check("cost-test-workspace", await meter.list());
assert.equal(quotaCheck.allowed, true, "quota should allow usage within limits");
assert.equal(quota.requests_per_minute, 10, "quota should be configurable");

const cache = new SemanticCache(0.8);
const embedding = hashEmbedding("saudade desejo silencio");
await cache.store({ workspace_id: "cost-test-workspace", provider: "openai", model: "gpt-4.1-mini", kind: "text", text: "saudade desejo silencio", embedding, estimated_savings: first.estimated_cost });
const hit = await cache.lookup({ workspace_id: "cost-test-workspace", text: "saudade e desejo no silencio", embedding: hashEmbedding("saudade e desejo no silencio"), kind: "text" });
assert.equal(hit.hit, true, "semantic cache should detect similar requests");

const report = await new CostReportingService().report();
assert(report.requests >= 1, "report should count requests");
assert(report.total_tokens >= 1500, "report should aggregate tokens");
assert(report.cache_savings >= first.estimated_cost, "report should aggregate cache savings");

console.log(JSON.stringify({
  status: "pass",
  usage_records: report.requests,
  total_tokens: report.total_tokens,
  total_cost: report.total_cost,
  cache_hits: report.cache_hits,
  alerts: report.alerts.length
}, null, 2));
