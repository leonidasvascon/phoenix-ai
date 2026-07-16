import type { StrategyContext } from "./types.ts";

export function prioritizeRecommendations(context: StrategyContext): Array<{ priority: "high" | "low" | "medium"; message: string }> {
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  return context.learning.recommendations
    .map((recommendation) => ({
      priority: recommendation.priority,
      message: recommendation.message
    }))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 6);
}
