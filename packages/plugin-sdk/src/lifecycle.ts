import type { PhoenixPlugin, PluginContext } from "./api.ts";
import { runWithTimeout } from "./sandbox.ts";

export async function runLifecycle(plugin: PhoenixPlugin, name: "onLoad" | "onEnable" | "onDisable" | "onUnload" | "onInstall" | "onUpgrade", context: PluginContext): Promise<void> {
  const handler = plugin[name];
  if (!handler) return;
  await runWithTimeout(`${plugin.manifest.id}.${name}`, pluginTimeoutMs(), () => handler.call(plugin, context));
}

export function pluginTimeoutMs(): number {
  return Number(process.env.PHOENIX_PLUGIN_TIMEOUT_MS ?? 3000);
}
