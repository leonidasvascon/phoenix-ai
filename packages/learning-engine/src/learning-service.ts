import { analyzeExecutions, type LearningAnalysis, type LearningExecution } from "./execution-analyzer.ts";
import { analyzeRealPerformance, type LearningFeedback, type RealPerformanceAnalysis } from "./feedback-performance-analyzer.ts";
import { generateRecommendations, type LearningRecommendation } from "./recommendation-engine.ts";

export type LearningReport = {
  summary: {
    total_executions: number;
    average_score: number;
    success_rate: number;
  };
  analysis: LearningAnalysis;
  real_performance: RealPerformanceAnalysis;
  recommendations: LearningRecommendation[];
};

export function createLearningReport(executions: LearningExecution[], feedbacks: LearningFeedback[] = []): LearningReport {
  const analysis = analyzeExecutions(executions);
  const realPerformance = analyzeRealPerformance(executions, feedbacks);

  return {
    summary: {
      total_executions: analysis.total_executions,
      average_score: analysis.average_score,
      success_rate: analysis.success_rate
    },
    analysis,
    real_performance: realPerformance,
    recommendations: generateRecommendations(analysis, realPerformance)
  };
}
