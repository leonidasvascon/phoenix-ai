import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { composeMediaPackage } from "@phoenix-ai/media-composer";
import { aggregateMetrics, loadBrand, readExecutionFiles, Runtime, type Brand, type RuntimeResponse, type Task } from "@phoenix-ai/runtime";

type TaskRequest = Partial<Task>;
type MediaPackageReference = {
  directory: string;
  files: string[];
};
type EditableBrand = Brand & {
  [key: string]: unknown;
};

const mediaPackageFiles = [
  "metadata.json",
  "roteiro.md",
  "legenda.txt",
  "hashtags.txt",
  "video_prompt.txt",
  "thumbnail_prompt.txt"
] as const;

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

export async function listExecutions(): Promise<Array<RuntimeResponse & { media_package?: MediaPackageReference }>> {
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

export async function getExecutionPackage(executionId: string) {
  const executions = await listExecutions();
  const execution = executions.find((item) => item.execution_id === executionId);

  if (!execution) {
    return null;
  }

  if (!execution.media_package) {
    return {
      execution,
      files: Object.fromEntries(mediaPackageFiles.map((file) => [file, ""]))
    };
  }

  const packagePath = resolve(process.cwd(), execution.media_package.directory);
  const files = await Promise.all(
    mediaPackageFiles.map(async (file) => {
      try {
        return [file, await readFile(resolve(packagePath, file), "utf8")] as const;
      } catch {
        return [file, ""] as const;
      }
    })
  );

  return {
    execution,
    files: Object.fromEntries(files)
  };
}

export async function getAnalytics() {
  const executions = await readExecutionFiles();

  return aggregateMetrics(executions);
}

export async function listBrands(): Promise<Brand[]> {
  const brandsPath = resolve(process.cwd(), "prompts", "brands");
  let files: string[] = [];

  try {
    files = await readdir(brandsPath);
  } catch {
    return [];
  }

  const brandIds = files
    .filter((file) => file.endsWith(".yaml") && !file.endsWith(".brand.yaml"))
    .map((file) => file.replace(/\.yaml$/, ""));

  return Promise.all(brandIds.map((brandId) => loadBrand(brandId)));
}

export async function getBrand(brandId: string): Promise<Brand | null> {
  try {
    return await loadBrand(brandId);
  } catch {
    return null;
  }
}

export async function updateBrand(brandId: string, input: unknown): Promise<Brand> {
  if (!/^[a-z0-9-]+$/.test(brandId)) {
    throw new Error("Invalid brand id.");
  }

  const brand = validateBrandInput(brandId, input);
  const brandPath = resolve(process.cwd(), "prompts", "brands", `${brandId}.yaml`);

  await writeFile(brandPath, stringifyYaml(brand), "utf8");

  return loadBrand(brandId);
}

function validateBrandInput(brandId: string, input: unknown): EditableBrand {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid Brand DNA.");
  }

  const brand = input as EditableBrand;

  if (!brand.brand || typeof brand.brand !== "object") {
    throw new Error("Brand identity is required.");
  }

  if (brand.brand.id !== brandId || typeof brand.brand.name !== "string" || !brand.brand.name.trim()) {
    throw new Error("Brand id and name are required.");
  }

  if (typeof brand.version !== "string" && typeof brand.version !== "number") {
    throw new Error("Brand version is required.");
  }

  if (brand.purpose !== undefined && typeof brand.purpose !== "string") {
    throw new Error("Brand purpose must be a string.");
  }

  return brand;
}

function stringifyYaml(value: Record<string, unknown>, indent = 0): string {
  const lines: string[] = [];
  const padding = " ".repeat(indent);

  for (const [key, item] of Object.entries(value)) {
    if (Array.isArray(item)) {
      lines.push(`${padding}${key}:`);
      for (const entry of item) {
        lines.push(`${padding}  - ${formatScalar(entry)}`);
      }
      if (indent === 0) lines.push("");
      continue;
    }

    if (item && typeof item === "object") {
      lines.push(`${padding}${key}:`);
      lines.push(stringifyYaml(item as Record<string, unknown>, indent + 2).trimEnd());
      if (indent === 0) lines.push("");
      continue;
    }

    if (typeof item === "string" && item.includes("\n")) {
      lines.push(`${padding}${key}: |`);
      for (const line of item.split("\n")) {
        lines.push(`${padding}  ${line}`);
      }
      if (indent === 0) lines.push("");
      continue;
    }

    lines.push(`${padding}${key}: ${formatScalar(item, key)}`);
    if (indent === 0) lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function formatScalar(value: unknown, key?: string): string {
  if (key === "version" && Number(value) === 1) return "1.0";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (value === null || value === undefined) return "";

  const text = String(value);
  if (!text || text.includes(":") || text.startsWith("-") || text !== text.trim()) {
    return JSON.stringify(text);
  }

  return text;
}

async function findMediaPackages(root = resolve(process.cwd(), "output")): Promise<Map<string, MediaPackageReference>> {
  const packages = new Map<string, MediaPackageReference>();

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
