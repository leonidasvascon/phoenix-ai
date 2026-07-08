import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { composeMediaPackage } from "@phoenix-ai/media-composer";
import { aggregateMetrics, loadBrand, parseSimpleYaml, readExecutionFiles, Runtime, type Brand, type RuntimeResponse, type Task } from "@phoenix-ai/runtime";

type TaskRequest = Partial<Task>;
type MediaPackageReference = {
  directory: string;
  files: string[];
};
type EditableBrand = Brand & {
  [key: string]: unknown;
};
type CreateBrandInput = {
  name?: unknown;
  purpose?: unknown;
  tone?: unknown;
  emotions?: unknown;
  preferred_hooks?: unknown;
  preferred_storytelling?: unknown;
  preferred_cta?: unknown;
  avoid?: unknown;
  forbidden_patterns?: unknown;
};
type DuplicateBrandInput = {
  name?: unknown;
  purpose?: unknown;
};
type ArchivedBrand = {
  id: string;
  nome: string;
  arquivado_em: string;
  arquivo: string;
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

export async function listArchivedBrands(): Promise<ArchivedBrand[]> {
  const archivedFiles = await readArchivedBrandFiles();

  return archivedFiles
    .map((file) => ({
      id: file.brand.brand.id,
      nome: file.brand.brand.name,
      arquivado_em: file.archivedAt,
      arquivo: file.relativePath
    }))
    .sort((a, b) => b.arquivado_em.localeCompare(a.arquivado_em));
}

export async function getBrand(brandId: string): Promise<Brand | null> {
  try {
    return await loadBrand(brandId);
  } catch {
    return null;
  }
}

export async function exportBrand(brandId: string): Promise<string | null> {
  if (!/^[a-z0-9-]+$/.test(brandId)) {
    throw new Error("Invalid brand id.");
  }

  try {
    return await readFile(resolve(process.cwd(), "prompts", "brands", `${brandId}.yaml`), "utf8");
  } catch {
    return null;
  }
}

export async function importBrand(input: unknown): Promise<Brand> {
  const source = typeof input === "string"
    ? input
    : input && typeof input === "object" && typeof (input as { yaml?: unknown }).yaml === "string"
      ? (input as { yaml: string }).yaml
      : "";

  if (!source.trim()) {
    throw new Error("Brand YAML is required.");
  }

  let parsed: unknown;

  try {
    parsed = parseSimpleYaml(source);
  } catch {
    throw new Error("Invalid Brand YAML.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid Brand YAML.");
  }

  const brand = parsed as EditableBrand;
  const identity = brand.brand;
  const brandId = identity && typeof identity === "object" && typeof identity.id === "string" ? identity.id.trim() : "";
  const brandName = identity && typeof identity === "object" && typeof identity.name === "string" ? identity.name.trim() : "";
  const purpose = typeof brand.purpose === "string" ? brand.purpose.trim() : "";

  if (!brandId || !/^[a-z0-9-]+$/.test(brandId) || !brandName || !purpose) {
    throw new Error("Brand id, name and purpose are required.");
  }

  const brandPath = resolve(process.cwd(), "prompts", "brands", `${brandId}.yaml`);

  try {
    await readFile(brandPath, "utf8");
    throw new Error("Brand already exists.");
  } catch (error) {
    if (error instanceof Error && error.message === "Brand already exists.") {
      throw error;
    }
  }

  await mkdir(resolve(process.cwd(), "prompts", "brands"), { recursive: true });
  await writeFile(brandPath, source.endsWith("\n") ? source : `${source}\n`, "utf8");

  return loadBrand(brandId);
}

export async function archiveBrand(brandId: string) {
  if (!/^[a-z0-9-]+$/.test(brandId)) {
    throw new Error("Invalid brand id.");
  }

  if (brandId === "encanto-intenso") {
    throw new Error("The default brand cannot be archived.");
  }

  const brandPath = resolve(process.cwd(), "prompts", "brands", `${brandId}.yaml`);
  const brand = await loadBrand(brandId);
  const archiveDirectory = resolve(process.cwd(), ".storage", "archived-brands");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archivePath = resolve(archiveDirectory, `${brandId}-${timestamp}.yaml`);

  await mkdir(archiveDirectory, { recursive: true });
  await rename(brandPath, archivePath);

  return {
    status: "archived",
    brand_id: brandId,
    brand_name: brand.brand.name,
    archived_at: timestamp,
    archive_path: archivePath.replace(`${process.cwd()}\\`, "").replace(`${process.cwd()}/`, "")
  };
}

export async function restoreBrand(brandId: string): Promise<Brand> {
  if (!/^[a-z0-9-]+$/.test(brandId)) {
    throw new Error("Invalid brand id.");
  }

  const activeBrandPath = resolve(process.cwd(), "prompts", "brands", `${brandId}.yaml`);

  try {
    await readFile(activeBrandPath, "utf8");
    throw new Error("Brand already exists.");
  } catch (error) {
    if (error instanceof Error && error.message === "Brand already exists.") {
      throw error;
    }
  }

  const archivedFiles = await readArchivedBrandFiles();
  const latestArchive = archivedFiles
    .filter((file) => file.brand.brand.id === brandId)
    .sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))[0];

  if (!latestArchive) {
    throw new Error("Archived brand not found.");
  }

  await mkdir(resolve(process.cwd(), "prompts", "brands"), { recursive: true });
  await rename(latestArchive.absolutePath, activeBrandPath);

  return loadBrand(brandId);
}

export async function createBrand(input: unknown): Promise<Brand> {
  const payload = validateCreateBrandInput(input);
  const brandId = slugify(payload.name);

  if (!brandId) {
    throw new Error("Brand name must generate a valid id.");
  }

  const brandPath = resolve(process.cwd(), "prompts", "brands", `${brandId}.yaml`);

  try {
    await readFile(brandPath, "utf8");
    throw new Error("Brand already exists.");
  } catch (error) {
    if (error instanceof Error && error.message === "Brand already exists.") {
      throw error;
    }
  }

  const forbiddenPatterns = payload.forbidden_patterns.length > 0 ? payload.forbidden_patterns : payload.avoid;
  const brand: EditableBrand = {
    version: "1.0",
    brand: {
      id: brandId,
      name: payload.name
    },
    purpose: payload.purpose,
    tone: payload.tone,
    emotions: payload.emotions,
    preferred_hooks: payload.preferred_hooks,
    preferred_storytelling: payload.preferred_storytelling,
    preferred_cta: payload.preferred_cta,
    avoid: payload.avoid,
    forbidden_patterns: forbiddenPatterns
  };

  await writeFile(brandPath, stringifyYaml(brand), "utf8");

  return loadBrand(brandId);
}

export async function duplicateBrand(sourceBrandId: string, input: unknown): Promise<Brand> {
  if (!/^[a-z0-9-]+$/.test(sourceBrandId)) {
    throw new Error("Invalid source brand id.");
  }

  const sourceBrand = await getBrand(sourceBrandId);

  if (!sourceBrand) {
    throw new Error("Source brand not found.");
  }

  const payload = validateDuplicateBrandInput(input);
  const newBrandId = slugify(payload.name);

  if (!newBrandId) {
    throw new Error("Brand name must generate a valid id.");
  }

  const brandPath = resolve(process.cwd(), "prompts", "brands", `${newBrandId}.yaml`);

  try {
    await readFile(brandPath, "utf8");
    throw new Error("Brand already exists.");
  } catch (error) {
    if (error instanceof Error && error.message === "Brand already exists.") {
      throw error;
    }
  }

  const duplicatedBrand: EditableBrand = {
    ...(structuredClone(sourceBrand) as EditableBrand),
    brand: {
      ...sourceBrand.brand,
      id: newBrandId,
      name: payload.name
    },
    purpose: payload.purpose
  };

  await writeFile(brandPath, stringifyYaml(duplicatedBrand), "utf8");

  return loadBrand(newBrandId);
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

function validateDuplicateBrandInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid duplicate payload.");
  }

  const payload = input as DuplicateBrandInput;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";

  if (!name) {
    throw new Error("New brand name is required.");
  }

  return {
    name,
    purpose: typeof payload.purpose === "string" ? payload.purpose.trim() : ""
  };
}

async function readArchivedBrandFiles() {
  const archiveDirectory = resolve(process.cwd(), ".storage", "archived-brands");
  let files: string[] = [];

  try {
    files = await readdir(archiveDirectory);
  } catch {
    return [];
  }

  const archivedFiles = await Promise.all(
    files
      .filter((file) => file.endsWith(".yaml"))
      .map(async (file) => {
        const absolutePath = resolve(archiveDirectory, file);
        const source = await readFile(absolutePath, "utf8");
        const brand = parseSimpleYaml(source) as Brand;
        const archivedAt = parseArchiveTimestamp(file);

        if (!brand.brand?.id || !brand.brand?.name) {
          return null;
        }

        return {
          absolutePath,
          archivedAt,
          brand,
          relativePath: absolutePath.replace(`${process.cwd()}\\`, "").replace(`${process.cwd()}/`, "")
        };
      })
  );

  return archivedFiles.filter((file): file is NonNullable<(typeof archivedFiles)[number]> => Boolean(file));
}

function parseArchiveTimestamp(file: string): string {
  const match = file.match(/-(\d{4}-\d{2}-\d{2}T.+)\.yaml$/);

  return match?.[1] ?? "";
}

function validateCreateBrandInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid brand payload.");
  }

  const payload = input as CreateBrandInput;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";

  if (!name) {
    throw new Error("Brand name is required.");
  }

  return {
    name,
    purpose: typeof payload.purpose === "string" ? payload.purpose.trim() : "",
    tone: normalizeRecord(payload.tone),
    emotions: normalizeStringArray(payload.emotions),
    preferred_hooks: normalizeStringArray(payload.preferred_hooks),
    preferred_storytelling: normalizeStringArray(payload.preferred_storytelling),
    preferred_cta: typeof payload.preferred_cta === "string" ? payload.preferred_cta.trim() : "",
    avoid: normalizeStringArray(payload.avoid),
    forbidden_patterns: normalizeStringArray(payload.forbidden_patterns)
  };
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
      if (item.length === 0) {
        lines.push(`${padding}${key}: []`);
        if (indent === 0) lines.push("");
        continue;
      }

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

function normalizeRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
