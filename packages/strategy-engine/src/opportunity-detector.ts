import type { StrategyContext, StrategyOpportunity } from "./types.ts";

export function detectOpportunities(context: StrategyContext): StrategyOpportunity[] {
  const opportunities: StrategyOpportunity[] = [];
  const realTheme = context.learning.real_performance.performance_by_theme[0];
  const bestInternalTheme = context.learning.analysis.score_by_theme[0];
  const bestFormat = context.learning.analysis.score_by_format[0];
  const lowVolumeHighScoreTheme = context.learning.analysis.score_by_theme.find((item) => item.average_score >= 90 && item.count <= 2);

  if (realTheme && realTheme.engagement_rate > 0) {
    opportunities.push({
      type: "theme",
      priority: "high",
      message: `Amplie variacoes de ${realTheme.name}: lidera performance real com ${realTheme.engagement_rate}% de engajamento.`
    });
  }

  if (lowVolumeHighScoreTheme) {
    opportunities.push({
      type: "theme",
      priority: "medium",
      message: `${lowVolumeHighScoreTheme.name} tem score alto e baixo volume. Bom candidato para exploracao controlada.`
    });
  }

  if (bestInternalTheme && !realTheme) {
    opportunities.push({
      type: "theme",
      priority: "medium",
      message: `Use ${bestInternalTheme.name} como eixo inicial: melhor score interno disponivel.`
    });
  }

  if (bestFormat) {
    opportunities.push({
      type: "format",
      priority: "medium",
      message: `Priorize ${bestFormat.name}: formato com melhor score medio interno.`
    });
  }

  opportunities.push({
    type: "storytelling",
    priority: "low",
    message: "Teste storytelling Hero, confissao e contraste emocional para descobrir novos padroes vencedores."
  });

  return opportunities;
}
