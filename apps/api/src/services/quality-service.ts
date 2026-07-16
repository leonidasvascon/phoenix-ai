import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { QualityReport } from "../../../../scripts/quality-types.ts";

export type QualityHistoryItem = {
  date: string;
  file: string;
  generated_at: string;
  average_score: number;
  status: "FAIL" | "PASS";
  benchmarks: QualityReport["benchmarks"];
  regressions: QualityReport["regressions"];
};

export type QualityHistoryResponse = {
  latest: QualityReport | null;
  history: QualityHistoryItem[];
};

const storageReportsDirectory = resolve(process.cwd(), ".storage", "quality", "reports");
const storageLatestPath = resolve(storageReportsDirectory, "latest.json");
const checkedInReportPath = resolve(process.cwd(), "reports", "quality-report.json");

export async function getLatestQualityReport(): Promise<QualityReport | null> {
  return await readReport(storageLatestPath) ?? await readReport(checkedInReportPath);
}

export async function getQualityHistory(): Promise<QualityHistoryResponse> {
  const latest = await getLatestQualityReport();
  const files = await listReportFiles();
  const reports = await Promise.all(files.map(async (file) => {
    const report = await readReport(resolve(storageReportsDirectory, file));

    if (!report) return null;

    return {
      date: file.replace(/\.json$/, ""),
      file,
      generated_at: report.generated_at,
      average_score: report.average_score,
      status: report.status,
      benchmarks: report.benchmarks,
      regressions: report.regressions
    } satisfies QualityHistoryItem;
  }));

  return {
    latest,
    history: reports.filter((item): item is QualityHistoryItem => Boolean(item))
  };
}

async function readReport(path: string): Promise<QualityReport | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as QualityReport;
  } catch {
    return null;
  }
}

async function listReportFiles(): Promise<string[]> {
  try {
    const entries = await readdir(storageReportsDirectory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && entry.name !== "latest.json")
      .map((entry) => entry.name)
      .sort()
      .reverse();
  } catch {
    return [];
  }
}
