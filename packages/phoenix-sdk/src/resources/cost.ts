import type { PhoenixClient } from "../client.ts";
import type { PhoenixCostBudget, PhoenixCostQuota, PhoenixCostReport, PhoenixCostUsageRecord, PhoenixPricingEntry, PhoenixSemanticCacheEntry } from "../types.ts";

export class CostResource {
  private readonly client: PhoenixClient;

  constructor(client: PhoenixClient) {
    this.client = client;
  }

  report(): Promise<PhoenixCostReport> {
    return this.client.request("/cost");
  }

  usage(): Promise<PhoenixCostUsageRecord[]> {
    return this.client.request("/cost/usage");
  }

  budgets(): Promise<PhoenixCostBudget[]> {
    return this.client.request("/cost/budgets");
  }

  updateBudget(input: Partial<PhoenixCostBudget>): Promise<PhoenixCostBudget> {
    return this.client.request("/cost/budgets", { method: "PATCH", body: input });
  }

  quotas(): Promise<PhoenixCostQuota[]> {
    return this.client.request("/cost/quotas");
  }

  updateQuota(input: Partial<PhoenixCostQuota>): Promise<PhoenixCostQuota> {
    return this.client.request("/cost/quotas", { method: "PATCH", body: input });
  }

  pricing(): Promise<PhoenixPricingEntry[]> {
    return this.client.request("/cost/pricing");
  }

  cache(): Promise<PhoenixSemanticCacheEntry[]> {
    return this.client.request("/cost/cache");
  }

  clearCache(): Promise<{ status: "success"; cleared: true }> {
    return this.client.request("/cost/cache/clear", { method: "POST" });
  }
}
