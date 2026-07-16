import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runBenchmarks, runRegression, type BenchmarkResult, type RegressionResult } from "@phoenix-ai/evaluation-engine";
import { readExecutionFiles } from "@phoenix-ai/runtime";

export type EvaluationReport = {
  id: string;
  generated_at: string;
  summary: {
    benchmark_count: number;
    benchmark_passed: number;
    regression_count: number;
    regression_passed: number;
    average_overall_score: number;
    failed_content_count: number;
  };
  dimensions: Record<string, number>;
  benchmarks: BenchmarkResult[];
  regressions: RegressionResult[];
  failed_content: RegressionResult[];
};

const evaluationPath = resolve(process.cwd(), ".storage", "evaluation", "latest.json");

export async function getLatestEvaluationReport(): Promise<EvaluationReport | null> {
  try {
    return JSON.parse(await readFile(evaluationPath, "utf8")) as EvaluationReport;
  } catch {
    return null;
  }
}

export async function runEvaluation(): Promise<EvaluationReport> {
  const [benchmarks, executions] = await Promise.all([
    runBenchmarks(),
    readExecutionFiles()
  ]);
  const regressions = runRegression(executions);
  const failedContent = regressions.filter((item) => !item.passed);
  const report: EvaluationReport = {
    id: crypto.randomUUID(),
    generated_at: new Date().toISOString(),
    summary: {
      benchmark_count: benchmarks.length,
      benchmark_passed: benchmarks.filter((item) => item.passed).length,
      regression_count: regressions.length,
      regression_passed: regressions.filter((item) => item.passed).length,
      average_overall_score: average(regressions.map((item) => item.evaluation.overall_score)),
      failed_content_count: failedContent.length
    },
    dimensions: averageDimensions(regressions),
    benchmarks,
    regressions,
    failed_content: failedContent
  };

  await mkdir(resolve(process.cwd(), ".storage", "evaluation"), { recursive: true });
  await writeFile(evaluationPath, JSON.stringify(report, null, 2), "utf8");

  return report;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function averageDimensions(regressions: RegressionResult[]): Record<string, number> {
  const buckets = new Map<string, number[]>();

  for (const regression of regressions) {
    for (const [dimension, score] of Object.entries(regression.evaluation.dimensions)) {
      buckets.set(dimension, [...(buckets.get(dimension) ?? []), score]);
    }
  }

  return Object.fromEntries(Array.from(buckets.entries()).map(([dimension, scores]) => [dimension, average(scores)]));
}
