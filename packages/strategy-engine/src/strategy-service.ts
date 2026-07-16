import { createStrategyPlan } from "./planner.ts";
import type { StrategyContext, StrategyInput, StrategyPlan } from "./types.ts";

export class StrategyService {
  generate(input: Partial<StrategyInput>, context: StrategyContext): StrategyPlan {
    return createStrategyPlan(normalizeInput(input), context);
  }
}

export function normalizeInput(input: Partial<StrategyInput>): StrategyInput {
  const goal = input.goal ?? "grow_instagram";
  const periodDays = Number(input.period_days ?? 30);
  const postsPerWeek = Number(input.posts_per_week ?? 7);

  if (!["grow_instagram", "increase_engagement", "increase_saves", "test_new_themes"].includes(goal)) {
    throw new Error("Invalid strategy goal.");
  }

  if (!Number.isFinite(periodDays) || periodDays < 7 || periodDays > 120) {
    throw new Error("period_days must be between 7 and 120.");
  }

  if (!Number.isFinite(postsPerWeek) || postsPerWeek < 1 || postsPerWeek > 21) {
    throw new Error("posts_per_week must be between 1 and 21.");
  }

  return {
    goal,
    period_days: Math.round(periodDays),
    posts_per_week: Math.round(postsPerWeek),
    brand: input.brand,
    platform: input.platform ?? "instagram"
  };
}
