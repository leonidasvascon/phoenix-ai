import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validatePluginManifest, type PluginManifest } from "./manifest.ts";

export async function readAndValidatePluginManifest(pluginPath: string): Promise<PluginManifest> {
  const source = await readFile(resolve(pluginPath, "plugin.json"), "utf8");
  return validatePluginManifest(JSON.parse(source) as unknown);
}
