export type StrategyGoal = "grow_instagram" | "increase_engagement" | "increase_saves" | "test_new_themes";

export type StrategyInput = {
  goal: StrategyGoal;
  period_days: number;
  posts_per_week: number;
  brand?: string;
  platform?: string;
};

export type StrategyContext = {
  learning: {
    summary: {
      total_executions: number;
      average_score: number;
      success_rate: number;
    };
    analysis: {
      score_by_theme: Array<{ name: string; average_score: number; count: number }>;
      score_by_brand: Array<{ name: string; average_score: number; count: number }>;
      score_by_format: Array<{ name: string; average_score: number; count: number }>;
      top_themes: Array<{ name: string; count: number }>;
      top_brands: Array<{ name: string; count: number }>;
    };
    real_performance: {
      performance_by_theme: Array<{
        name: string;
        count: number;
        views: number;
        engagement_rate: number;
        save_rate: number;
        share_rate: number;
        followers_gained: number;
      }>;
    };
    recommendations: Array<{
      type: string;
      priority: "high" | "low" | "medium";
      message: string;
    }>;
  };
};

export type StrategyOpportunity = {
  type: "format" | "storytelling" | "theme";
  priority: "high" | "low" | "medium";
  message: string;
};

export type ContentGap = {
  type: "concentration" | "missing_theme" | "missing_format";
  message: string;
  suggestion: string;
};

export type StrategyCalendarItem = {
  day: number;
  theme: string;
  format: "carousel" | "reel" | "story";
  platform: string;
  brand: string;
  objective: string;
  reason: string;
  task: {
    brand: string;
    theme: string;
    objective: string;
    platform: string;
    format: "carousel" | "reel" | "story";
  };
};

export type StrategyPlan = {
  id: string;
  generated_at: string;
  input: StrategyInput;
  summary: {
    goal: StrategyGoal;
    period_days: number;
    total_posts: number;
    primary_brand: string;
    primary_platform: string;
  };
  priorities: Array<{
    priority: "high" | "low" | "medium";
    message: string;
  }>;
  opportunities: StrategyOpportunity[];
  gaps: ContentGap[];
  calendar: StrategyCalendarItem[];
};
