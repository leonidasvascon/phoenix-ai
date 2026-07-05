export type RankedMetric = {
  name: string;
  count: number;
};

export type AnalyticsReport = {
  total_executions: number;
  success_executions: number;
  success_rate: number;
  fallback_executions: number;
  average_score: number;
  average_duration_ms: number;
  estimated_total_cost: number;
  top_failed_agents: RankedMetric[];
  top_themes: string[];
  top_brands: string[];
};

