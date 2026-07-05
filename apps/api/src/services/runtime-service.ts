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
  const mediaPackages = await findMediaPackages();
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

  return executions
    .map((execution) => ({
      ...execution,
      media_package: mediaPackages.get(execution.execution_id)
    }))
    .sort((a, b) => {
      const aTimestamp = a.logs[0]?.timestamp ?? "";
      const bTimestamp = b.logs[0]?.timestamp ?? "";

      return bTimestamp.localeCompare(aTimestamp);
    });
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

async function findMediaPackages(root = resolve(process.cwd(), "output")): Promise<Map<string, { directory: string; files: string[] }>> {
  const packages = new Map<string, { directory: string; files: string[] }>();

  async function visit(directory: string): Promise<void> {
    let entries: Awaited<ReturnType<typeof readdir>> = [];

    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    const metadata = entries.find((entry) => entry.isFile() && entry.name === "metadata.json");

    if (metadata) {
      try {
        const source = await readFile(resolve(directory, metadata.name), "utf8");
        const parsed = JSON.parse(source) as { execution_id?: string };
        if (parsed.execution_id) {
          packages.set(parsed.execution_id, {
            directory: directory.replace(`${process.cwd()}\\`, "").replace(`${process.cwd()}/`, ""),
            files: entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
          });
        }
      } catch {
        return;
      }
    }

    await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => visit(resolve(directory, entry.name))));
  }

  await visit(root);

  return packages;
}
