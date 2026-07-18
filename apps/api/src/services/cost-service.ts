import { BudgetService, CostReportingService, PricingRegistry, QuotaService, SemanticCache, TokenMeter } from "@phoenix-ai/cost-intelligence";
import type { Budget, Quota } from "@phoenix-ai/cost-intelligence";

export function getCostUsage() {
  return new TokenMeter().list();
}

export function getCostReport() {
  return new CostReportingService().report();
}

export function getCostBudgets() {
  return new BudgetService().list();
}

export function updateCostBudget(input: Partial<Budget>) {
  return new BudgetService().update(input);
}

export function getCostQuotas() {
  return new QuotaService().list();
}

export function updateCostQuota(input: Partial<Quota>) {
  return new QuotaService().update(input);
}

export function getCostPricing() {
  return new PricingRegistry().list();
}

export function getCostCache() {
  return new SemanticCache().list();
}

export function clearCostCache() {
  return new SemanticCache().clear();
}
