import { getVersionInfo } from "@phoenix-ai/version";
import { isPluginCapability, type PluginCapability } from "./capability.ts";

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  engine: string;
  author: string;
  capabilities: PluginCapability[];
  entry?: string;
  description?: string;
  permissions?: string[];
};

export function validatePluginManifest(input: unknown): PluginManifest {
  if (!input || typeof input !== "object") throw new Error("Plugin manifest must be an object.");
  const manifest = input as Partial<PluginManifest>;
  const id = typeof manifest.id === "string" ? manifest.id.trim() : "";
  const name = typeof manifest.name === "string" ? manifest.name.trim() : "";
  const version = typeof manifest.version === "string" ? manifest.version.trim() : "";
  const engine = typeof manifest.engine === "string" ? manifest.engine.trim() : "";
  const author = typeof manifest.author === "string" ? manifest.author.trim() : "";
  const capabilities = Array.isArray(manifest.capabilities) ? manifest.capabilities : [];
  if (!/^[a-z0-9][a-z0-9-]{1,80}$/.test(id)) throw new Error("Invalid plugin id.");
  if (!name || !version || !engine || !author) throw new Error("Plugin name, version, engine and author are required.");
  if (capabilities.length === 0 || !capabilities.every(isPluginCapability)) throw new Error("Plugin capabilities are invalid.");
  if (!isEngineCompatible(engine, getVersionInfo().version)) throw new Error(`Plugin ${id} is incompatible with Phoenix ${getVersionInfo().version}.`);
  return {
    id,
    name,
    version,
    engine,
    author,
    capabilities: capabilities as PluginCapability[],
    entry: typeof manifest.entry === "string" ? manifest.entry : undefined,
    description: typeof manifest.description === "string" ? manifest.description : undefined,
    permissions: Array.isArray(manifest.permissions) ? manifest.permissions.filter((item): item is string => typeof item === "string") : []
  };
}

export function isEngineCompatible(range: string, version: string): boolean {
  const engineMajor = range.match(/\d+/)?.[0];
  const versionMajor = version.match(/\d+/)?.[0];
  if (!engineMajor || !versionMajor) return false;
  return engineMajor === versionMajor;
}
