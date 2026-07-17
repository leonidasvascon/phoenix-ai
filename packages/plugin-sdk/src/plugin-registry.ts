import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import type { PluginManifest } from "./manifest.ts";

let writeQueue: Promise<void> = Promise.resolve();

export type PluginRecord = {
  id: string;
  manifest: PluginManifest;
  path: string;
  status: "installed" | "enabled" | "disabled" | "invalid";
  installedAt: string;
  enabledAt?: string;
  disabledAt?: string;
  error?: string;
  logs: Array<{ timestamp: string; level: "info" | "warn" | "error"; message: string; metadata?: Record<string, unknown> }>;
};

export function pluginsStorageRoot(): string {
  return resolve(process.cwd(), ".storage", "plugins");
}

export async function ensurePluginStorage(): Promise<void> {
  await mkdir(pluginsStorageRoot(), { recursive: true });
  await Promise.all([
    writeJsonIfMissing("installed.json", []),
    writeJsonIfMissing("enabled.json", []),
    writeJsonIfMissing("registry.json", {})
  ]);
}

export async function readPluginRegistry(): Promise<Record<string, PluginRecord>> {
  await ensurePluginStorage();
  return readJson<Record<string, PluginRecord>>("registry.json", {});
}

export async function writePluginRegistry(registry: Record<string, PluginRecord>): Promise<void> {
  await ensurePluginStorage();
  await writeJson("registry.json", registry);
  await writeJson("installed.json", Object.values(registry).filter((record) => record.status !== "invalid").map((record) => record.id));
  await writeJson("enabled.json", Object.values(registry).filter((record) => record.status === "enabled").map((record) => record.id));
}

export async function appendPluginLog(pluginId: string, level: "info" | "warn" | "error", message: string, metadata?: Record<string, unknown>): Promise<void> {
  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    const registry = await readJson<Record<string, PluginRecord>>("registry.json", {});
    const record = registry[pluginId];
    if (!record) return;
    record.logs.push({ timestamp: new Date().toISOString(), level, message, metadata });
    record.logs = record.logs.slice(-100);
    await writeJsonDirect("registry.json", registry);
    await writeJsonDirect("installed.json", Object.values(registry).filter((item) => item.status !== "invalid").map((item) => item.id));
    await writeJsonDirect("enabled.json", Object.values(registry).filter((item) => item.status === "enabled").map((item) => item.id));
  });
  await writeQueue;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(resolve(pluginsStorageRoot(), file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    await writeJsonDirect(file, value);
  });
  await writeQueue;
}

async function writeJsonDirect(file: string, value: unknown): Promise<void> {
  const target = resolve(pluginsStorageRoot(), file);
  const temporary = resolve(pluginsStorageRoot(), `${file}.${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify(value, null, 2), "utf8");
  await rm(target, { force: true });
  await rename(temporary, target);
}

async function writeJsonIfMissing(file: string, value: unknown): Promise<void> {
  try {
    await readFile(resolve(pluginsStorageRoot(), file), "utf8");
  } catch {
    await writeJson(file, value);
  }
}
