export type LearningExecution = {
  status: string;
  score: number;
  execution?: {
    duration_ms?: number;
    provider?: string;
    task?: Record<string, unknown>;
    agents?: Array<{
      name?: string;
      status?: string;
      provider?: string;
    }>;
  };
  quality?: {
    failed_agents?: Array<{
      agent?: string;
      reason?: string;
    }>;
  };
};

export type AverageMetric = {
  name: string;
  average_score: number;
  count: number;
};

export type CountMetric = {
  name: string;
  count: number;
};

export type LearningAnalysis = {
  total_executions: number;
  success_executions: number;
  success_rate: number;
  average_score: number;
  score_by_theme: AverageMetric[];
  score_by_brand: AverageMetric[];
  score_by_format: AverageMetric[];
  fallback_agents: CountMetric[];
  top_themes: CountMetric[];
  top_brands: CountMetric[];
  average_duration_by_format: AverageMetric[];
};

type AverageBucket = {
  count: number;
  total: number;
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

function percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function getTaskValue(execution: LearningExecution, key: "brand" | "format" | "theme"): string | undefined {
  const value = execution.execution?.task?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function incrementAverage(map: Map<string, AverageBucket>, key: string | undefined, value: number | undefined): void {
  if (!key || typeof value !== "number" || Number.isNaN(value)) return;
  const current = map.get(key) ?? { count: 0, total: 0 };
  map.set(key, {
    count: current.count + 1,
    total: current.total + value
  });
}

function incrementCount(map: Map<string, number>, key: string | undefined): void {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + 1);
}

function rankAverage(map: Map<string, AverageBucket>): AverageMetric[] {
  return Array.from(map.entries())
    .map(([name, bucket]) => ({
      name,
      average_score: Number((bucket.total / bucket.count).toFixed(2)),
      count: bucket.count
    }))
    .sort((a, b) => b.average_score - a.average_score || b.count - a.count || a.name.localeCompare(b.name));
}

function rankCount(map: Map<string, number>): CountMetric[] {
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function hasFallbackAgent(execution: LearningExecution, agent: { provider?: string }): boolean {
  return agent.provider === "mock" && execution.execution?.provider !== "mock";
}

export function analyzeExecutions(executions: LearningExecution[]): LearningAnalysis {
  const scoreByTheme = new Map<string, AverageBucket>();
  const scoreByBrand = new Map<string, AverageBucket>();
  const scoreByFormat = new Map<string, AverageBucket>();
  const durationByFormat = new Map<string, AverageBucket>();
  const fallbackAgents = new Map<string, number>();
  const themes = new Map<string, number>();
  const brands = new Map<string, number>();

  for (const execution of executions) {
    const theme = getTaskValue(execution, "theme");
    const brand = getTaskValue(execution, "brand");
    const format = getTaskValue(execution, "format");

    incrementAverage(scoreByTheme, theme, execution.score);
    incrementAverage(scoreByBrand, brand, execution.score);
    incrementAverage(scoreByFormat, format, execution.score);
    incrementAverage(durationByFormat, format, execution.execution?.duration_ms);
    incrementCount(themes, theme);
    incrementCount(brands, brand);

    for (const failedAgent of execution.quality?.failed_agents ?? []) {
      incrementCount(fallbackAgents, failedAgent.agent);
    }

    for (const agent of execution.execution?.agents ?? []) {
      if (hasFallbackAgent(execution, agent)) {
        incrementCount(fallbackAgents, agent.name);
      }
    }
  }

  const totalExecutions = executions.length;
  const successExecutions = executions.filter((execution) => execution.status === "success").length;

  return {
    total_executions: totalExecutions,
    success_executions: successExecutions,
    success_rate: percentage(successExecutions, totalExecutions),
    average_score: average(executions.map((execution) => execution.score)),
    score_by_theme: rankAverage(scoreByTheme),
    score_by_brand: rankAverage(scoreByBrand),
    score_by_format: rankAverage(scoreByFormat),
    fallback_agents: rankCount(fallbackAgents),
    top_themes: rankCount(themes),
    top_brands: rankCount(brands),
    average_duration_by_format: rankAverage(durationByFormat)
  };
}
