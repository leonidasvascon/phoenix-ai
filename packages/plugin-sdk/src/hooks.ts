export const pluginHooks = [
  "beforeTask",
  "afterTask",
  "beforePublish",
  "afterPublish",
  "beforeStrategy",
  "afterStrategy",
  "beforeEvaluation",
  "afterEvaluation",
  "beforeScheduler",
  "afterScheduler"
] as const;

export type PluginHookName = typeof pluginHooks[number];

export function isPluginHook(value: unknown): value is PluginHookName {
  return typeof value === "string" && pluginHooks.includes(value as PluginHookName);
}
