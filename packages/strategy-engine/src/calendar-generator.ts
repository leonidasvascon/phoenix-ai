import type { ContentGap, StrategyCalendarItem, StrategyContext, StrategyInput, StrategyOpportunity } from "./types.ts";

const fallbackThemes = ["saudade", "desejo", "paixao", "silencio", "reencontro", "culpa", "esperanca", "reconquista"];
const fallbackFormats: Array<"carousel" | "reel" | "story"> = ["reel", "carousel", "story"];

export function generateCalendar(
  input: StrategyInput,
  context: StrategyContext,
  opportunities: StrategyOpportunity[],
  gaps: ContentGap[]
): StrategyCalendarItem[] {
  const totalPosts = Math.max(1, Math.round((input.period_days / 7) * input.posts_per_week));
  const interval = Math.max(1, Math.floor(input.period_days / totalPosts));
  const themes = buildThemeQueue(context, gaps);
  const formats = buildFormatQueue(context);
  const brand = input.brand ?? context.learning.analysis.score_by_brand[0]?.name ?? context.learning.analysis.top_brands[0]?.name ?? "encanto-intenso";
  const platform = input.platform ?? "instagram";
  const objective = objectiveForGoal(input.goal);
  const opportunityReason = opportunities[0]?.message ?? "Plano balanceado com base no historico disponivel.";

  return Array.from({ length: totalPosts }, (_, index) => {
    const theme = themes[index % themes.length];
    const format = formats[index % formats.length];
    const day = Math.min(input.period_days, 1 + index * interval);
    const reason = reasonFor(theme, format, context, gaps) ?? opportunityReason;

    return {
      day,
      theme,
      format,
      platform,
      brand,
      objective,
      reason,
      task: {
        brand,
        theme,
        objective,
        platform,
        format
      }
    };
  });
}

function buildThemeQueue(context: StrategyContext, gaps: ContentGap[]): string[] {
  const realThemes = context.learning.real_performance.performance_by_theme.map((item) => item.name);
  const internalThemes = context.learning.analysis.score_by_theme.map((item) => item.name);
  const gapThemes = gaps
    .filter((gap) => gap.type === "missing_theme")
    .map((gap) => gap.message.match(/tema ([^ ]+)/)?.[1])
    .filter((theme): theme is string => Boolean(theme));

  return unique([...realThemes, ...internalThemes, ...gapThemes, ...fallbackThemes]);
}

function buildFormatQueue(context: StrategyContext): Array<"carousel" | "reel" | "story"> {
  const known = context.learning.analysis.score_by_format
    .map((item) => item.name)
    .filter((format): format is "carousel" | "reel" | "story" => format === "carousel" || format === "reel" || format === "story");

  return unique([...known, ...fallbackFormats]);
}

function reasonFor(theme: string, format: string, context: StrategyContext, gaps: ContentGap[]): string | null {
  const realTheme = context.learning.real_performance.performance_by_theme.find((item) => item.name === theme);
  if (realTheme) return `Tema com ${realTheme.engagement_rate}% de engajamento real e ${realTheme.share_rate}% de share rate.`;

  const internalTheme = context.learning.analysis.score_by_theme.find((item) => item.name === theme);
  if (internalTheme) return `Tema com score interno medio de ${internalTheme.average_score}.`;

  const gap = gaps.find((item) => item.message.includes(theme));
  if (gap) return gap.suggestion;

  const formatMetric = context.learning.analysis.score_by_format.find((item) => item.name === format);
  if (formatMetric) return `Formato ${format} com score medio de ${formatMetric.average_score}.`;

  return null;
}

function objectiveForGoal(goal: StrategyInput["goal"]): string {
  if (goal === "increase_engagement") return "aumentar engajamento";
  if (goal === "increase_saves") return "aumentar salvamentos";
  if (goal === "test_new_themes") return "testar novos temas";
  return "crescer no Instagram";
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
