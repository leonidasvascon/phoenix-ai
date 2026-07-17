import { readPluginRegistry } from "@phoenix-ai/plugin-sdk";
import { discoverPlugins, enablePlugin, executePluginHook, listPlugins } from "@phoenix-ai/plugin-sdk";

const plugins = await discoverPlugins();
const ids = new Set(plugins.map((plugin) => plugin.id));

for (const required of ["hello-world", "analytics-demo", "scheduler-demo"]) {
  if (!ids.has(required)) throw new Error(`Expected plugin ${required} to be discovered.`);
}

await enablePlugin({ id: "hello-world" });
await executePluginHook("beforeTask", { task: { brand: "encanto-intenso", theme: "saudade", format: "reel" } });
await executePluginHook("afterTask", { result: { score: 95 } });

const registry = await readPluginRegistry();
if (registry["hello-world"]?.status !== "enabled") throw new Error("hello-world plugin was not enabled.");
if (!registry["hello-world"].logs.some((log) => log.message.includes("beforeTask"))) throw new Error("beforeTask hook did not log.");

const listed = await listPlugins();
if (listed.length < 3) throw new Error("Plugin list did not return example plugins.");

console.log(JSON.stringify({ status: "PASS", plugins: listed.map((plugin) => ({ id: plugin.id, status: plugin.status })) }, null, 2));
