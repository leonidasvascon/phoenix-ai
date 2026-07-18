import { buildCostAlerts } from "./alerts.ts";
import { BudgetService } from "./budget-service.ts";
import { QuotaService } from "./quota-service.ts";
import { SemanticCache } from "./semantic-cache.ts";
import { TokenMeter } from "./token-meter.ts";
import type { CostReport } from "./types.ts";

export class CostReportingService {
  async report(): Promise<CostReport> {
    const meter = new TokenMeter();
    const records = await meter.list();
    const budgets = await new BudgetService().applyUsage(records);
    const quotas = await new QuotaService().list();
    const cache = await new SemanticCache().list();
    const byProvider: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    for (const record of records) {
      byProvider[record.provider] = Number(((byProvider[record.provider] ?? 0) + record.consolidated_cost).toFixed(6));
      byModel[record.model] = Number(((byModel[record.model] ?? 0) + record.consolidated_cost).toFixed(6));
    }
    return {
      total_cost: Number(records.reduce((sum, record) => sum + record.consolidated_cost, 0).toFixed(6)),
      total_tokens: records.reduce((sum, record) => sum + record.total_tokens, 0),
      requests: records.length,
      cache_hits: records.filter((record) => record.cache_hit).length,
      cache_savings: Number(cache.reduce((sum, entry) => sum + entry.estimated_savings, 0).toFixed(6)),
      by_provider: byProvider,
      by_model: byModel,
      budgets,
      quotas,
      alerts: buildCostAlerts({ budgets, quotas })
    };
  }
}
