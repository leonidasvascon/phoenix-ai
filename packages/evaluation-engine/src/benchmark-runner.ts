import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Evaluator } from "./evaluator.ts";
import type { EvaluationResult } from "./scorer.ts";

export type BenchmarkCase = {
  id: string;
  category: string;
  input: {
    brand?: Record<string, unknown>;
    output: Record<string, unknown>;
    task?: Record<string, unknown>;
  };
  expected: {
    min_score: number;
    passed: boolean;
  };
};

export type BenchmarkResult = {
  id: string;
  category: string;
  min_score: number;
  evaluation: EvaluationResult;
  passed: boolean;
};

export async function runBenchmarks(root = resolve(process.cwd(), "benchmarks")): Promise<BenchmarkResult[]> {
  const cases = await readBenchmarkCases(root);
  const evaluator = new Evaluator();

  return cases.map((benchmark) => {
    const evaluation = evaluator.evaluate(benchmark.input);

    return {
      id: benchmark.id,
      category: benchmark.category,
      min_score: benchmark.expected.min_score,
      evaluation,
      passed: benchmark.expected.passed
        ? evaluation.overall_score >= benchmark.expected.min_score && evaluation.passed
        : evaluation.overall_score < benchmark.expected.min_score && !evaluation.passed
    };
  });
}

async function readBenchmarkCases(root: string): Promise<BenchmarkCase[]> {
  const files = await listJsonFiles(root);
  const cases = await Promise.all(files.map(async (file) => JSON.parse(await readFile(file, "utf8")) as BenchmarkCase));

  return cases.sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
}

async function listJsonFiles(directory: string): Promise<string[]> {
  let entries: Awaited<ReturnType<typeof readdir>> = [];

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return listJsonFiles(path);
    if (entry.isFile() && entry.name.endsWith(".json")) return [path];
    return [];
  }));

  return nested.flat();
}
