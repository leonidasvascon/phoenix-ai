export const pluginCapabilities = [
  "agent",
  "provider",
  "tool",
  "analytics",
  "scheduler",
  "publishing",
  "strategy",
  "evaluation",
  "studio"
] as const;

export type PluginCapability = typeof pluginCapabilities[number];

export function isPluginCapability(value: unknown): value is PluginCapability {
  return typeof value === "string" && pluginCapabilities.includes(value as PluginCapability);
}
