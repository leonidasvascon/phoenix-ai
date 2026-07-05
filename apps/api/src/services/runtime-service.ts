import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { composeMediaPackage } from "@phoenix-ai/media-composer";
import { aggregateMetrics, readExecutionFiles, Runtime, type RuntimeResponse, type Task } from "@phoenix-ai/runtime";

type TaskRequest = Partial<Task>;

function isValidFormat(format: unknown): format is Task["format"] {
  return typeof format === "string" && ["reel", "carousel", "story"].includes(format);
}

function normalizeTask(input: TaskRequest): Task {
  if (!input.brand || !input.theme || !input.objective || !isValidFormat(input.format)) {
    throw new Error("Invalid task.");
  }

  return {
    brand: input.brand,
    theme: input.theme,
    objective: input.objective,
    platform: input.platform ?? "instagram",
    format: input.format,
    language: input.language
  };
}

export async function executeTask(input: TaskRequest) {
  const task = normalizeTask(input);
  const runtimeResponse = await Runtime.execute(task);
  const mediaPackage = await composeMediaPackage(runtimeResponse);

  return {
    ...runtimeResponse,
    media_package: {
      directory: mediaPackage.directory,
      files: Object.keys(mediaPackage.files)
    }
  };
}

export async function listExecutions(): Promise<RuntimeResponse[]> {
  const executionsPath = resolve(process.cwd(), ".storage", "executions");
  let files: string[] = [];

  try {
    files = await readdir(executionsPath);
  } catch {
    return [];
  }

  const executions = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => JSON.parse(await readFile(resolve(executionsPath, file), "utf8")) as RuntimeResponse)
  );

  return executions.sort((a, b) => b.execution_id.localeCompare(a.execution_id));
}

export async function getAnalytics() {
  const executions = await readExecutionFiles();

  return aggregateMetrics(executions);
}

export function listBrands() {
  return [
    {
      id: "encanto-intenso",
      name: "Encanto Intenso"
    }
  ];
}
