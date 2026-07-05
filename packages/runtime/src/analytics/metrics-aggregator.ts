import type { AnalyticsReport, RankedMetric } from "./analytics-report.ts";
import type { RuntimeResponse } from "../types.ts";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

function percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function increment(map: Map<string, number>, key: string | undefined): void {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + 1);
}

function rank(map: Map<string, number>): RankedMetric[] {
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function topNames(map: Map<string, number>, limit = 5): string[] {
  return rank(map).slice(0, limit).map((item) => item.name);
}

function hasFallback(response: RuntimeResponse): boolean {
  return response.execution.agents.some((agent) => agent.provider === "mock")
    && response.execution.provider !== "mock";
}

function getTaskValue(response: RuntimeResponse, key: "theme" | "brand"): string | undefined {
  const task = response.execution.task as Record<string, unknown> | undefined;
  const value = task?.[key];
  return typeof value === "string" ? value : undefined;
}

export function aggregateMetrics(executions: RuntimeResponse[]): AnalyticsReport {
  const totalExecutions = executions.length;
  const successExecutions = executions.filter((execution) => execution.status === "success").length;
  const failedAgents = new Map<string, number>();
  const themes = new Map<string, number>();
  const brands = new Map<string, number>();

  for (const execution of executions) {
    for (const failedAgent of execution.quality.failed_agents) {
      increment(failedAgents, failedAgent.agent);
    }

    increment(themes, getTaskValue(execution, "theme"));
    increment(brands, getTaskValue(execution, "brand"));
  }

  return {
    total_executions: totalExecutions,
    success_executions: successExecutions,
    success_rate: percentage(successExecutions, totalExecutions),
    fallback_executions: executions.filter(hasFallback).length,
    average_score: average(executions.map((execution) => execution.score)),
    average_duration_ms: average(executions.map((execution) => execution.execution.duration_ms)),
    estimated_total_cost: Number(
      executions.reduce((sum, execution) => sum + execution.execution.cost.estimated, 0).toFixed(6)
    ),
    top_failed_agents: rank(failedAgents),
    top_themes: topNames(themes),
    top_brands: topNames(brands)
  };
}

