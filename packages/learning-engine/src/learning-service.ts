import { analyzeExecutions, type LearningAnalysis, type LearningExecution } from "./execution-analyzer.ts";
import { generateRecommendations, type LearningRecommendation } from "./recommendation-engine.ts";

export type LearningReport = {
  summary: {
    total_executions: number;
    average_score: number;
    success_rate: number;
  };
  analysis: LearningAnalysis;
  recommendations: LearningRecommendation[];
};

export function createLearningReport(executions: LearningExecution[]): LearningReport {
  const analysis = analyzeExecutions(executions);

  return {
    summary: {
      total_executions: analysis.total_executions,
      average_score: analysis.average_score,
      success_rate: analysis.success_rate
    },
    analysis,
    recommendations: generateRecommendations(analysis)
  };
}
