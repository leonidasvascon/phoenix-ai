import { randomUUID } from "node:crypto";
import { costPath, readJson, writeJson } from "./storage.ts";
import type { Budget, BudgetScope, CostUsageRecord } from "./types.ts";

export class BudgetService {
  private readonly path: string;

  constructor(path = costPath("budgets", "budgets.json")) {
    this.path = path;
  }

  async list(): Promise<Budget[]> {
    const budgets = await readJson<Budget[]>(this.path, []);
    if (budgets.length) return budgets;
    const defaults = [createBudget("workspace", "default-workspace", "default-workspace", 25)];
    await this.save(defaults);
    return defaults;
  }

  async update(input: Partial<Budget> & { scope?: BudgetScope; scope_id?: string; workspace_id?: string }): Promise<Budget> {
    const budgets = await this.list();
    const scope = input.scope ?? "workspace";
    const scopeId = input.scope_id ?? input.workspace_id ?? "default-workspace";
    const workspaceId = input.workspace_id ?? "default-workspace";
    const current = budgets.find((budget) => budget.scope === scope && budget.scope_id === scopeId) ?? createBudget(scope, scopeId, workspaceId, input.amount ?? 25);
    const next = evaluateBudget({
      ...current,
      ...input,
      scope,
      scope_id: scopeId,
      workspace_id: workspaceId,
      updated_at: new Date().toISOString()
    });
    await this.save([...budgets.filter((budget) => budget.id !== current.id), next]);
    return next;
  }

  async applyUsage(records: CostUsageRecord[]): Promise<Budget[]> {
    const budgets = await this.list();
    const next = budgets.map((budget) => {
      const spent = records
        .filter((record) => record.workspace_id === budget.workspace_id)
        .filter((record) => matchesScope(record, budget))
        .reduce((sum, record) => sum + record.consolidated_cost, 0);
      return evaluateBudget({ ...budget, spent, remaining: Math.max(0, budget.amount - spent), updated_at: new Date().toISOString() });
    });
    await this.save(next);
    return next;
  }

  private async save(budgets: Budget[]): Promise<void> {
    await writeJson(this.path, budgets);
  }
}

function createBudget(scope: BudgetScope, scopeId: string, workspaceId: string, amount: number): Budget {
  return evaluateBudget({
    id: randomUUID(),
    scope,
    scope_id: scopeId,
    workspace_id: workspaceId,
    period: "monthly",
    amount,
    currency: "USD",
    warning_threshold: 0.8,
    state: "normal",
    spent: 0,
    remaining: amount,
    updated_at: new Date().toISOString()
  });
}

function evaluateBudget(budget: Budget): Budget {
  const ratio = budget.amount > 0 ? budget.spent / budget.amount : 1;
  return {
    ...budget,
    remaining: Math.max(0, budget.amount - budget.spent),
    state: ratio >= 1.1 ? "blocked" : ratio >= 1 ? "exceeded" : ratio >= budget.warning_threshold ? "warning" : "normal"
  };
}

function matchesScope(record: CostUsageRecord, budget: Budget): boolean {
  if (budget.scope === "workspace") return true;
  if (budget.scope === "user") return record.user_id === budget.scope_id;
  if (budget.scope === "api_key") return record.api_key_id === budget.scope_id;
  if (budget.scope === "workflow") return record.workflow_id === budget.scope_id;
  if (budget.scope === "plugin") return record.plugin_id === budget.scope_id;
  return false;
}
