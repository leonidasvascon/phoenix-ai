export { analyzeExecutions } from "./execution-analyzer.ts";
export type { AverageMetric, CountMetric, LearningAnalysis, LearningExecution } from "./execution-analyzer.ts";
export { analyzeRealPerformance } from "./feedback-performance-analyzer.ts";
export type {
  ExecutionPerformanceMetric,
  LearningFeedback,
  RealPerformanceAnalysis,
  ThemePerformanceMetric
} from "./feedback-performance-analyzer.ts";
export { createLearningReport } from "./learning-service.ts";
export type { LearningReport } from "./learning-service.ts";
export { generateRecommendations } from "./recommendation-engine.ts";
export type { LearningRecommendation } from "./recommendation-engine.ts";
