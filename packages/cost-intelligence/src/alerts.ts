import type { Budget, Quota } from "./types.ts";

export function buildCostAlerts(input: { budgets: Budget[]; quotas: Quota[] }): Array<{ level: "info" | "warning" | "critical"; message: string; scope_id?: string }> {
  const alerts: Array<{ level: "info" | "warning" | "critical"; message: string; scope_id?: string }> = [];
  for (const budget of input.budgets) {
    if (budget.state === "warning") alerts.push({ level: "warning", message: `Budget ${budget.scope_id} is above warning threshold.`, scope_id: budget.scope_id });
    if (budget.state === "exceeded" || budget.state === "blocked") alerts.push({ level: "critical", message: `Budget ${budget.scope_id} is ${budget.state}.`, scope_id: budget.scope_id });
  }
  if (!alerts.length) alerts.push({ level: "info", message: "Cost governance is within configured limits." });
  return alerts;
}
