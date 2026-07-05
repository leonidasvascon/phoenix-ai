import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RuntimeResponse, Task } from "../runtime/src/types.ts";
import { exportJson } from "./exporters/json.ts";
import { exportMarkdown } from "./exporters/markdown.ts";
import { exportTxt } from "./exporters/txt.ts";

export type MediaComposerOptions = {
  outputRoot?: string;
  date?: Date;
};

export type MediaPackage = {
  directory: string;
  files: Record<string, string>;
};

type ComposerSource = RuntimeResponse & {
  execution: RuntimeResponse["execution"] & {
    task?: Task;
  };
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function nextPackageDirectory(baseDirectory: string, format: string): Promise<string> {
  await mkdir(baseDirectory, { recursive: true });

  const entries = await readdir(baseDirectory, { withFileTypes: true });
  const prefix = `${format}_`;
  const nextNumber =
    entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
      .map((entry) => Number(entry.name.slice(prefix.length)))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1;

  return join(baseDirectory, `${prefix}${String(nextNumber).padStart(3, "0")}`);
}

function getString(output: Record<string, unknown>, key: string, fallback = ""): string {
  const value = output[key];

  return typeof value === "string" ? value : fallback;
}

function getHashtags(output: Record<string, unknown>): string[] {
  const value = output.hashtags;

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildScript(response: ComposerSource): string {
  return exportMarkdown("Roteiro", [
    ["Gancho", getString(response.output, "hook")],
    ["Desenvolvimento", getString(response.output, "story")],
    ["Fechamento", getString(response.output, "ending")],
    ["CTA", getString(response.output, "cta")]
  ]);
}

export async function composeMediaPackage(
  response: ComposerSource,
  options: MediaComposerOptions = {}
): Promise<MediaPackage> {
  const task = response.execution.task;
  const date = formatDate(options.date ?? new Date());
  const outputRoot = options.outputRoot ?? "output";
  const format = task?.format ?? "content";
  const baseDirectory = join(outputRoot, date);
  const directory = await nextPackageDirectory(baseDirectory, format);
  await mkdir(directory, { recursive: true });

  const files: Record<string, string> = {
    "roteiro.md": buildScript(response),
    "legenda.txt": exportTxt(getString(response.output, "caption")),
    "hashtags.txt": exportTxt(getHashtags(response.output).join(" ")),
    "thumbnail_prompt.txt": exportTxt(getString(response.output, "thumbnail_prompt")),
    "video_prompt.txt": exportTxt(getString(response.output, "video_prompt")),
    "metadata.json": exportJson({
      execution_id: response.execution_id,
      status: response.status,
      score: response.score,
      quality: response.quality,
      pipeline: response.pipeline,
      task,
      generated_at: new Date().toISOString()
    })
  };

  await Promise.all(
    Object.entries(files).map(([filename, content]) => writeFile(join(directory, filename), content, "utf8"))
  );

  return {
    directory,
    files
  };
}
