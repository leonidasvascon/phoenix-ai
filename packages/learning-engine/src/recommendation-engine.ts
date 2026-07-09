import type { LearningAnalysis } from "./execution-analyzer.ts";
import type { RealPerformanceAnalysis } from "./feedback-performance-analyzer.ts";

export type LearningRecommendation = {
  type: "brand" | "fallback" | "format" | "performance" | "theme";
  priority: "high" | "medium" | "low";
  message: string;
};

function best<T extends { average_score: number; count: number; name: string }>(items: T[]): T | undefined {
  return items.find((item) => item.count >= 1);
}

export function generateRecommendations(analysis: LearningAnalysis, realPerformance?: RealPerformanceAnalysis): LearningRecommendation[] {
  const recommendations: LearningRecommendation[] = [];
  const bestTheme = best(analysis.score_by_theme);
  const bestBrand = best(analysis.score_by_brand);
  const bestFormat = best(analysis.score_by_format);
  const slowestFormat = [...analysis.average_duration_by_format].sort((a, b) => b.average_score - a.average_score)[0];
  const topFallback = analysis.fallback_agents[0];
  const bestRealTheme = realPerformance?.performance_by_theme[0];
  const bestRealExecution = realPerformance?.best_execution;

  if (bestTheme && bestTheme.average_score >= 90) {
    recommendations.push({
      type: "theme",
      priority: "high",
      message: `O tema ${bestTheme.name} apresenta score medio alto. Priorize variacoes desse tema.`
    });
  }

  if (bestBrand && bestBrand.average_score >= 90) {
    recommendations.push({
      type: "brand",
      priority: "medium",
      message: `A marca ${bestBrand.name} esta mantendo score medio forte. Use esse DNA como referencia para novos testes.`
    });
  }

  if (bestFormat && bestFormat.average_score >= 90) {
    recommendations.push({
      type: "format",
      priority: "medium",
      message: `O formato ${bestFormat.name} tem bom desempenho medio. Gere mais conteudos nesse formato.`
    });
  }

  if (topFallback) {
    recommendations.push({
      type: "fallback",
      priority: "high",
      message: `O agente ${topFallback.name} concentrou ${topFallback.count} fallback(s) ou falha(s). Revise prompt, provider ou quality gate desse agente.`
    });
  }

  if (analysis.success_rate < 90 && analysis.total_executions > 0) {
    recommendations.push({
      type: "performance",
      priority: "high",
      message: `A taxa de sucesso esta em ${analysis.success_rate}%. Revise jobs com falha antes de aumentar o volume.`
    });
  }

  if (slowestFormat && slowestFormat.average_score > 1000) {
    recommendations.push({
      type: "format",
      priority: "low",
      message: `O formato ${slowestFormat.name} tem maior tempo medio de execucao. Avalie simplificar pipeline ou prompts.`
    });
  }

  if (bestRealTheme && bestRealTheme.engagement_rate > 0) {
    recommendations.push({
      type: "theme",
      priority: "high",
      message: `No feedback real, o tema ${bestRealTheme.name} lidera com ${bestRealTheme.engagement_rate}% de engajamento. Priorize novas variacoes desse tema.`
    });
  }

  if (bestRealExecution) {
    recommendations.push({
      type: "performance",
      priority: "medium",
      message: `A execucao ${bestRealExecution.execution_id} teve o melhor desempenho real, com ${bestRealExecution.views} visualizacoes e ${bestRealExecution.engagement_rate}% de engajamento. Use esse pacote como referencia criativa.`
    });
  }

  if (realPerformance && realPerformance.total_feedbacks > 0 && realPerformance.matched_feedbacks === 0) {
    recommendations.push({
      type: "performance",
      priority: "medium",
      message: "Ha feedbacks salvos, mas nenhum corresponde a execucoes atuais. Confira se os execution_id foram cadastrados corretamente."
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "performance",
      priority: "low",
      message: "Ainda nao ha volume suficiente para recomendacoes fortes. Continue gerando execucoes para melhorar o aprendizado."
    });
  }

  return recommendations;
}
