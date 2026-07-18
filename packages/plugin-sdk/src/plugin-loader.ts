import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { resolveSecretValue } from "@phoenix-ai/secrets";
import { getTraceId } from "@phoenix-ai/observability";
import type { PluginHookName } from "./hooks.ts";
import type { PhoenixPlugin, PluginContext } from "./api.ts";
import { runLifecycle } from "./lifecycle.ts";
import { readAndValidatePluginManifest } from "./plugin-validator.ts";
import { appendPluginLog, ensurePluginStorage, pluginsStorageRoot, readPluginRegistry, writePluginRegistry, type PluginRecord } from "./plugin-registry.ts";
import { runWithTimeout } from "./sandbox.ts";

export type PluginActionInput = {
  id?: unknown;
  workspaceId?: string;
};

export function pluginsRoot(): string {
  return resolve(process.cwd(), "plugins");
}

export async function discoverPlugins(): Promise<PluginRecord[]> {
  await ensurePluginStorage();
  const registry = await readPluginRegistry();
  let entries: Awaited<ReturnType<typeof readdir>> = [];

  try {
    entries = await readdir(pluginsRoot(), { withFileTypes: true });
  } catch {
    await writePluginRegistry(registry);
    return Object.values(registry);
  }

  for (const entry of entries.filter((item) => item.isDirectory())) {
    const pluginPath = resolve(pluginsRoot(), entry.name);

    try {
      const manifest = await readAndValidatePluginManifest(pluginPath);
      const existing = registry[manifest.id];
      registry[manifest.id] = {
        id: manifest.id,
        manifest,
        path: pluginPath,
        status: existing?.status && existing.status !== "invalid" ? existing.status : "installed",
        installedAt: existing?.installedAt ?? new Date().toISOString(),
        enabledAt: existing?.enabledAt,
        disabledAt: existing?.disabledAt,
        logs: existing?.logs ?? []
      };
    } catch (error) {
      const id = entry.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
      registry[id] = {
        id,
        manifest: {
          id,
          name: entry.name,
          version: "0.0.0",
          engine: "unknown",
          author: "unknown",
          capabilities: []
        },
        path: pluginPath,
        status: "invalid",
        installedAt: registry[id]?.installedAt ?? new Date().toISOString(),
        error: error instanceof Error ? error.message : "Invalid plugin.",
        logs: registry[id]?.logs ?? []
      };
    }
  }

  for (const [pluginId, record] of Object.entries(registry)) {
    if (record.path.startsWith(pluginsRoot()) && !existsSync(record.path)) {
      delete registry[pluginId];
    }
  }

  await writePluginRegistry(registry);
  await loadEnabledPlugins(Object.values(registry));
  return Object.values(registry);
}

export async function listPlugins(): Promise<PluginRecord[]> {
  await discoverPlugins();
  const registry = await readPluginRegistry();
  return Object.values(registry).sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}

export async function getPlugin(pluginId: string): Promise<PluginRecord | null> {
  await discoverPlugins();
  const registry = await readPluginRegistry();
  return registry[pluginId] ?? null;
}

export async function installPlugin(input: PluginActionInput): Promise<PluginRecord> {
  const pluginId = validatePluginId(input.id);
  await discoverPlugins();
  const registry = await readPluginRegistry();
  const record = registry[pluginId];
  if (!record) throw new Error("Plugin not found.");
  if (record.status === "invalid") throw new Error(record.error ?? "Invalid plugin.");
  const plugin = await importPlugin(record);
  await runLifecycle(plugin, "onInstall", createPluginContext(record, input.workspaceId));
  record.status = "installed";
  record.installedAt = record.installedAt ?? new Date().toISOString();
  record.disabledAt = new Date().toISOString();
  await writePluginRegistry(registry);
  await appendPluginLog(pluginId, "info", "Plugin installed.");
  return (await readPluginRegistry())[pluginId];
}

export async function enablePlugin(input: PluginActionInput): Promise<PluginRecord> {
  const pluginId = validatePluginId(input.id);
  await discoverPlugins();
  const registry = await readPluginRegistry();
  const record = registry[pluginId];
  if (!record) throw new Error("Plugin not found.");
  if (record.status === "invalid") throw new Error(record.error ?? "Invalid plugin.");
  const plugin = await importPlugin(record);
  const context = createPluginContext(record, input.workspaceId);
  await runLifecycle(plugin, "onLoad", context);
  if (plugin.setup) await runWithTimeout(`${pluginId}.setup`, pluginTimeoutMs(), () => plugin.setup?.(context));
  await runLifecycle(plugin, "onEnable", context);
  record.status = "enabled";
  record.enabledAt = new Date().toISOString();
  record.disabledAt = undefined;
  await writePluginRegistry(registry);
  await appendPluginLog(pluginId, "info", "Plugin enabled.");
  return (await readPluginRegistry())[pluginId];
}

export async function disablePlugin(input: PluginActionInput): Promise<PluginRecord> {
  const pluginId = validatePluginId(input.id);
  const registry = await readPluginRegistry();
  const record = registry[pluginId];
  if (!record) throw new Error("Plugin not found.");
  if (record.status === "enabled") {
    const plugin = await importPlugin(record);
    await runLifecycle(plugin, "onDisable", createPluginContext(record, input.workspaceId));
  }
  record.status = "disabled";
  record.disabledAt = new Date().toISOString();
  await writePluginRegistry(registry);
  await appendPluginLog(pluginId, "info", "Plugin disabled.");
  return (await readPluginRegistry())[pluginId];
}

export async function uninstallPlugin(pluginId: string, workspaceId?: string): Promise<{ status: "uninstalled"; id: string }> {
  const registry = await readPluginRegistry();
  const record = registry[pluginId];
  if (!record) throw new Error("Plugin not found.");
  if (record.status === "enabled") {
    const plugin = await importPlugin(record);
    await runLifecycle(plugin, "onUnload", createPluginContext(record, workspaceId));
  }
  delete registry[pluginId];
  await writePluginRegistry(registry);
  await rm(resolve(pluginsStorageRoot(), "data", `${pluginId}.json`), { force: true });
  return { status: "uninstalled", id: pluginId };
}

export async function executePluginHook(hook: PluginHookName, payload: unknown, workspaceId?: string): Promise<unknown[]> {
  await discoverPlugins();
  const registry = await readPluginRegistry();
  const results: unknown[] = [];

  for (const record of Object.values(registry).filter((item) => item.status === "enabled")) {
    try {
      const plugin = await importPlugin(record);
      const handler = plugin.hooks?.[hook];
      if (!handler) continue;
      const result = await runWithTimeout(`${record.id}.${hook}`, pluginTimeoutMs(), () => handler(payload, createPluginContext(record, workspaceId)));
      results.push({ plugin_id: record.id, status: "success", result });
      await appendPluginLog(record.id, "info", `Hook ${hook} executed.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Plugin hook failed.";
      results.push({ plugin_id: record.id, status: "error", error: message });
      await appendPluginLog(record.id, "error", `Hook ${hook} failed.`, { error: message });
    }
  }

  return results;
}

async function loadEnabledPlugins(records: PluginRecord[]): Promise<void> {
  for (const record of records.filter((item) => item.status === "enabled")) {
    try {
      const plugin = await importPlugin(record);
      await runLifecycle(plugin, "onLoad", createPluginContext(record));
    } catch (error) {
      await appendPluginLog(record.id, "error", "Enabled plugin failed to load.", { error: error instanceof Error ? error.message : "Unknown error." });
    }
  }
}

async function importPlugin(record: PluginRecord): Promise<PhoenixPlugin> {
  const entry = record.manifest.entry ?? "index.ts";
  const entryPath = resolve(record.path, entry);
  if (!existsSync(entryPath)) throw new Error(`Plugin entry not found: ${entry}`);
  const module = await import(`${pathToFileURL(entryPath).href}?v=${Date.now()}`);
  const plugin = module.default as PhoenixPlugin | undefined;
  if (!plugin || typeof plugin !== "object" || !plugin.manifest) throw new Error("Plugin entry must export default definePlugin(...).");
  if (plugin.manifest.id !== record.manifest.id) throw new Error("Plugin manifest id does not match plugin export.");
  return plugin;
}

function createPluginContext(record: PluginRecord, workspaceId = "default-workspace"): PluginContext {
  return {
    workspace: { id: workspaceId },
    logger: {
      info: (message, metadata) => { void appendPluginLog(record.id, "info", message, metadata); },
      warn: (message, metadata) => { void appendPluginLog(record.id, "warn", message, metadata); },
      error: (message, metadata) => { void appendPluginLog(record.id, "error", message, metadata); }
    },
    storage: {
      get: (key) => readPluginData(record.id).then((data) => data[key]),
      set: async (key, value) => {
        const data = await readPluginData(record.id);
        data[key] = value;
        await writePluginData(record.id, data);
      }
    },
    secretResolver: {
      resolve: (reference) => resolveSecretValue(reference)
    },
    runtime: {},
    api: {},
    events: {
      emit: async (event, payload) => {
        await appendPluginLog(record.id, "info", `Event emitted: ${event}`, payload && typeof payload === "object" ? payload as Record<string, unknown> : undefined);
      }
    },
    knowledgeGraph: {
      registerEntityType: async (type) => {
        await appendPluginLog(record.id, "info", `Knowledge entity type registered: ${type}`);
      },
      registerRelationType: async (type) => {
        await appendPluginLog(record.id, "info", `Knowledge relation type registered: ${type}`);
      },
      registerReranker: async (id) => {
        await appendPluginLog(record.id, "info", `Knowledge reranker registered: ${id}`);
      }
    },
    models: {
      registerProvider: async (id) => {
        await appendPluginLog(record.id, "info", `Model provider registered: ${id}`);
      },
      registerModel: async (id) => {
        await appendPluginLog(record.id, "info", `Model registered: ${id}`);
      },
      registerRoutingPolicy: async (id) => {
        await appendPluginLog(record.id, "info", `Model routing policy registered: ${id}`);
      }
    },
    metrics: {
      increment: (name) => { void appendPluginLog(record.id, "info", `Metric incremented: ${name}`); }
    },
    trace: {
      id: getTraceId() ?? randomUUID()
    }
  };
}

async function readPluginData(pluginId: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(resolve(pluginsStorageRoot(), "data", `${pluginId}.json`), "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function writePluginData(pluginId: string, value: Record<string, unknown>): Promise<void> {
  await mkdir(resolve(pluginsStorageRoot(), "data"), { recursive: true });
  await writeFile(resolve(pluginsStorageRoot(), "data", `${pluginId}.json`), JSON.stringify(value, null, 2), "utf8");
}

function validatePluginId(input: unknown): string {
  const pluginId = typeof input === "string" ? input.trim() : "";
  if (!/^[a-z0-9][a-z0-9-]{1,80}$/.test(pluginId)) throw new Error("Invalid plugin id.");
  return pluginId;
}

function pluginTimeoutMs(): number {
  return Number(process.env.PHOENIX_PLUGIN_TIMEOUT_MS ?? 3000);
}
