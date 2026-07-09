import type { LearningExecution } from "./execution-analyzer.ts";

export type LearningFeedback = {
  execution_id: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followers_gained: number;
  posted_at: string;
};

export type ThemePerformanceMetric = {
  name: string;
  count: number;
  views: number;
  likes: number;
  shares: number;
  saves: number;
  followers_gained: number;
  engagement_rate: number;
  save_rate: number;
  share_rate: number;
};

export type ExecutionPerformanceMetric = {
  execution_id: string;
  theme: string;
  brand: string;
  format: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followers_gained: number;
  engagement_rate: number;
  save_rate: number;
  share_rate: number;
  internal_score: number;
  posted_at: string;
};

export type RealPerformanceAnalysis = {
  total_feedbacks: number;
  matched_feedbacks: number;
  feedback_coverage_rate: number;
  performance_by_theme: ThemePerformanceMetric[];
  best_execution: ExecutionPerformanceMetric | null;
  worst_executions: ExecutionPerformanceMetric[];
};

type ThemeBucket = {
  count: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followers_gained: number;
};

function percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function getExecutionId(execution: LearningExecution): string | undefined {
  const rootId = execution.execution_id;
  const nestedId = execution.execution?.id;

  if (typeof rootId === "string" && rootId.trim()) return rootId;
  if (typeof nestedId === "string" && nestedId.trim()) return nestedId;

  return undefined;
}

function getTaskValue(execution: LearningExecution, key: "brand" | "format" | "theme"): string {
  const value = execution.execution?.task?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "unknown";
}

function toExecutionPerformance(execution: LearningExecution, feedback: LearningFeedback): ExecutionPerformanceMetric {
  const engagement = feedback.likes + feedback.comments + feedback.shares + feedback.saves;

  return {
    execution_id: feedback.execution_id,
    theme: getTaskValue(execution, "theme"),
    brand: getTaskValue(execution, "brand"),
    format: getTaskValue(execution, "format"),
    platform: feedback.platform,
    views: feedback.views,
    likes: feedback.likes,
    comments: feedback.comments,
    shares: feedback.shares,
    saves: feedback.saves,
    followers_gained: feedback.followers_gained,
    engagement_rate: percentage(engagement, feedback.views),
    save_rate: percentage(feedback.saves, feedback.views),
    share_rate: percentage(feedback.shares, feedback.views),
    internal_score: execution.score,
    posted_at: feedback.posted_at
  };
}

function addToThemeBucket(map: Map<string, ThemeBucket>, metric: ExecutionPerformanceMetric): void {
  const current = map.get(metric.theme) ?? {
    count: 0,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    followers_gained: 0
  };

  map.set(metric.theme, {
    count: current.count + 1,
    views: current.views + metric.views,
    likes: current.likes + metric.likes,
    comments: current.comments + metric.comments,
    shares: current.shares + metric.shares,
    saves: current.saves + metric.saves,
    followers_gained: current.followers_gained + metric.followers_gained
  });
}

function rankThemePerformance(map: Map<string, ThemeBucket>): ThemePerformanceMetric[] {
  return Array.from(map.entries())
    .map(([name, bucket]) => ({
      name,
      count: bucket.count,
      views: bucket.views,
      likes: bucket.likes,
      shares: bucket.shares,
      saves: bucket.saves,
      followers_gained: bucket.followers_gained,
      engagement_rate: percentage(bucket.likes + bucket.comments + bucket.shares + bucket.saves, bucket.views),
      save_rate: percentage(bucket.saves, bucket.views),
      share_rate: percentage(bucket.shares, bucket.views)
    }))
    .sort((a, b) => b.engagement_rate - a.engagement_rate || b.views - a.views || a.name.localeCompare(b.name));
}

export function analyzeRealPerformance(executions: LearningExecution[], feedbacks: LearningFeedback[] = []): RealPerformanceAnalysis {
  const executionsById = new Map<string, LearningExecution>();

  for (const execution of executions) {
    const executionId = getExecutionId(execution);
    if (executionId) executionsById.set(executionId, execution);
  }

  const themeBuckets = new Map<string, ThemeBucket>();
  const executionMetrics: ExecutionPerformanceMetric[] = [];

  for (const feedback of feedbacks) {
    const execution = executionsById.get(feedback.execution_id);
    if (!execution) continue;

    const metric = toExecutionPerformance(execution, feedback);
    executionMetrics.push(metric);
    addToThemeBucket(themeBuckets, metric);
  }

  const rankedExecutions = [...executionMetrics].sort(
    (a, b) => b.engagement_rate - a.engagement_rate || b.views - a.views || b.internal_score - a.internal_score
  );
  const worstExecutions = [...executionMetrics]
    .sort((a, b) => a.engagement_rate - b.engagement_rate || a.views - b.views || a.internal_score - b.internal_score)
    .slice(0, 5);

  return {
    total_feedbacks: feedbacks.length,
    matched_feedbacks: executionMetrics.length,
    feedback_coverage_rate: percentage(executionMetrics.length, executions.length),
    performance_by_theme: rankThemePerformance(themeBuckets),
    best_execution: rankedExecutions[0] ?? null,
    worst_executions: worstExecutions
  };
}
