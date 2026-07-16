export type QualityBenchmarkSummary = {
  passed: number;
  failed: number;
  total: number;
  pass_rate: number;
};

export type QualityRegressionSummary = {
  passed: number;
  failed: number;
  total: number;
};

export type QualityReport = {
  id: string;
  generated_at: string;
  average_score: number;
  benchmarks: QualityBenchmarkSummary;
  regressions: QualityRegressionSummary;
  thresholds: {
    average_score: number;
    benchmark_pass_rate: number;
    regression_failures: number;
  };
  status: "FAIL" | "PASS";
  failures: string[];
  benchmark_results: Array<{
    id: string;
    category: string;
    score: number;
    min_score: number;
    passed: boolean;
  }>;
  regression_results: Array<{
    execution_id: string;
    score: number;
    passed: boolean;
  }>;
};
