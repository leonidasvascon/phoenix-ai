import { generateCalendar } from "./calendar-generator.ts";
import { analyzeContentGaps } from "./content-gap-analyzer.ts";
import { detectOpportunities } from "./opportunity-detector.ts";
import { prioritizeRecommendations } from "./recommendation-prioritizer.ts";
import type { StrategyContext, StrategyInput, StrategyPlan } from "./types.ts";

export function createStrategyPlan(input: StrategyInput, context: StrategyContext): StrategyPlan {
  const opportunities = detectOpportunities(context);
  const gaps = analyzeContentGaps(context);
  const priorities = prioritizeRecommendations(context);
  const calendar = generateCalendar(input, context, opportunities, gaps);
  const primaryBrand = input.brand ?? context.learning.analysis.score_by_brand[0]?.name ?? context.learning.analysis.top_brands[0]?.name ?? "encanto-intenso";
  const primaryPlatform = input.platform ?? "instagram";

  return {
    id: crypto.randomUUID(),
    generated_at: new Date().toISOString(),
    input,
    summary: {
      goal: input.goal,
      period_days: input.period_days,
      total_posts: calendar.length,
      primary_brand: primaryBrand,
      primary_platform: primaryPlatform
    },
    priorities,
    opportunities,
    gaps,
    calendar
  };
}
