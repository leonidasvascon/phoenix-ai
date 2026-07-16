import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runBenchmarks, runRegression } from "../packages/evaluation-engine/src/index.ts";
import { readExecutionFiles } from "../packages/runtime/src/index.ts";
import type { QualityReport } from "./quality-types.ts";

const minimumAverageScore = Number(process.env.PHOENIX_MIN_AVERAGE_SCORE ?? 95);
const minimumBenchmarkPassRate = Number(process.env.PHOENIX_MIN_BENCHMARK_PASS_RATE ?? 100);
const maximumRegressionFailures = Number(process.env.PHOENIX_MAX_REGRESSION_FAILURES ?? 0);

export async function generateQualityReport(): Promise<QualityReport> {
  const [benchmarks, executions] = await Promise.all([
    runBenchmarks(),
    readExecutionFiles()
  ]);
  const regressions = runRegression(executions);
  const benchmarkPassed = benchmarks.filter((item) => item.passed).length;
  const regressionPassed = regressions.filter((item) => item.passed).length;
  const benchmarkPassRate = benchmarks.length > 0 ? percentage(benchmarkPassed, benchmarks.length) : 100;
  const regressionFailures = regressions.length - regressionPassed;
  const scoredItems = regressions.length > 0
    ? regressions.map((item) => item.evaluation.overall_score)
    : benchmarks.map((item) => item.evaluation.overall_score);
  const averageScore = average(scoredItems);
  const failures = [
    averageScore < minimumAverageScore ? `average_score ${averageScore} abaixo de ${minimumAverageScore}` : "",
    benchmarkPassRate < minimumBenchmarkPassRate ? `benchmark_pass_rate ${benchmarkPassRate}% abaixo de ${minimumBenchmarkPassRate}%` : "",
    regressionFailures > maximumRegressionFailures ? `regression_failures ${regressionFailures} acima de ${maximumRegressionFailures}` : ""
  ].filter(Boolean);

  return {
    id: crypto.randomUUID(),
    generated_at: new Date().toISOString(),
    average_score: averageScore,
    benchmarks: {
      passed: benchmarkPassed,
      failed: benchmarks.length - benchmarkPassed,
      total: benchmarks.length,
      pass_rate: benchmarkPassRate
    },
    regressions: {
      passed: regressionPassed,
      failed: regressionFailures,
      total: regressions.length
    },
    thresholds: {
      average_score: minimumAverageScore,
      benchmark_pass_rate: minimumBenchmarkPassRate,
      regression_failures: maximumRegressionFailures
    },
    status: failures.length > 0 ? "FAIL" : "PASS",
    failures,
    benchmark_results: benchmarks.map((item) => ({
      id: item.id,
      category: item.category,
      score: item.evaluation.overall_score,
      min_score: item.min_score,
      passed: item.passed
    })),
    regression_results: regressions.map((item) => ({
      execution_id: item.execution_id,
      score: item.evaluation.overall_score,
      passed: item.passed
    }))
  };
}

export async function persistQualityReport(report: QualityReport): Promise<void> {
  const date = report.generated_at.slice(0, 10);
  const storageDirectory = resolve(process.cwd(), ".storage", "quality", "reports");
  const reportsDirectory = resolve(process.cwd(), "reports");

  await Promise.all([
    mkdir(storageDirectory, { recursive: true }),
    mkdir(reportsDirectory, { recursive: true })
  ]);
  await Promise.all([
    writeFile(resolve(storageDirectory, `${date}.json`), JSON.stringify(report, null, 2), "utf8"),
    writeFile(resolve(storageDirectory, "latest.json"), JSON.stringify(report, null, 2), "utf8"),
    writeFile(resolve(reportsDirectory, "quality-report.json"), JSON.stringify(report, null, 2), "utf8"),
    writeFile(resolve(reportsDirectory, "quality-report.md"), renderQualityMarkdown(report), "utf8")
  ]);
}

export function renderQualityMarkdown(report: QualityReport): string {
  return [
    "# Phoenix AI Quality Report",
    "",
    `Status: **${report.status}**`,
    `Generated at: ${report.generated_at}`,
    "",
    "## Summary",
    "",
    `- Average score: ${report.average_score}`,
    `- Benchmarks: ${report.benchmarks.passed}/${report.benchmarks.total} (${report.benchmarks.pass_rate}%)`,
    `- Regressions: ${report.regressions.passed}/${report.regressions.total}`,
    `- Regression failures: ${report.regressions.failed}`,
    "",
    "## Thresholds",
    "",
    `- Minimum average score: ${report.thresholds.average_score}`,
    `- Minimum benchmark pass rate: ${report.thresholds.benchmark_pass_rate}%`,
    `- Maximum regression failures: ${report.thresholds.regression_failures}`,
    "",
    "## Failures",
    "",
    report.failures.length > 0 ? report.failures.map((failure) => `- ${failure}`).join("\n") : "- None",
    "",
    "## Benchmarks",
    "",
    "| ID | Category | Score | Min | Status |",
    "| --- | --- | ---: | ---: | --- |",
    ...report.benchmark_results.map((item) => `| ${item.id} | ${item.category} | ${item.score} | ${item.min_score} | ${item.passed ? "PASS" : "FAIL"} |`),
    "",
    "## Regressions",
    "",
    report.regression_results.length > 0 ? "| Execution | Score | Status |\n| --- | ---: | --- |" : "No persisted executions found.",
    ...report.regression_results.map((item) => `| ${item.execution_id} | ${item.score} | ${item.passed ? "PASS" : "FAIL"} |`)
  ].join("\n");
}

function average(values: number[]): number {
  if (values.length === 0) return 0;

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function percentage(value: number, total: number): number {
  if (total === 0) return 100;

  return Number(((value / total) * 100).toFixed(2));
}
