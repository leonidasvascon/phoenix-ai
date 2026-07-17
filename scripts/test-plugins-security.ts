import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { discoverPlugins, enablePlugin, executePluginHook, getPlugin } from "@phoenix-ai/plugin-sdk";

const fixturesRoot = resolve(process.cwd(), "plugins");
const incompatiblePath = resolve(fixturesRoot, "zz-security-incompatible");
const invalidPath = resolve(fixturesRoot, "zz-security-invalid");
const timeoutPath = resolve(fixturesRoot, "zz-security-timeout");

await Promise.all([
  rm(incompatiblePath, { recursive: true, force: true }),
  rm(invalidPath, { recursive: true, force: true }),
  rm(timeoutPath, { recursive: true, force: true })
]);

try {
  await mkdir(incompatiblePath, { recursive: true });
  await writeFile(resolve(incompatiblePath, "plugin.json"), JSON.stringify({
    id: "zz-security-incompatible",
    name: "Security Incompatible",
    version: "1.0.0",
    engine: "^99.0.0",
    author: "Phoenix AI",
    capabilities: ["tool"]
  }, null, 2));

  await mkdir(invalidPath, { recursive: true });
  await writeFile(resolve(invalidPath, "plugin.json"), "{ invalid json");

  await mkdir(timeoutPath, { recursive: true });
  await writeFile(resolve(timeoutPath, "plugin.json"), JSON.stringify({
    id: "zz-security-timeout",
    name: "Security Timeout",
    version: "1.0.0",
    engine: "^1.0.0",
    author: "Phoenix AI",
    capabilities: ["tool"],
    entry: "index.ts"
  }, null, 2));
  await writeFile(resolve(timeoutPath, "index.ts"), `
    import { definePlugin } from "@phoenix-ai/plugin-sdk";
    export default definePlugin({
      manifest: {
        id: "zz-security-timeout",
        name: "Security Timeout",
        version: "1.0.0",
        engine: "^1.0.0",
        author: "Phoenix AI",
        capabilities: ["tool"],
        entry: "index.ts"
      },
      hooks: {
        beforeTask: async () => {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    });
  `);

  process.env.PHOENIX_PLUGIN_TIMEOUT_MS = "25";
  await discoverPlugins();
  const incompatible = await getPlugin("zz-security-incompatible");
  const invalid = await getPlugin("zz-security-invalid");
  if (incompatible?.status !== "invalid") throw new Error("Incompatible plugin was not rejected.");
  if (invalid?.status !== "invalid") throw new Error("Invalid plugin was not rejected.");

  await enablePlugin({ id: "zz-security-timeout" });
  const results = await executePluginHook("beforeTask", { task: { brand: "encanto-intenso" } });
  const timeoutResult = results.find((item) => Boolean(item) && typeof item === "object" && (item as { plugin_id?: string }).plugin_id === "zz-security-timeout");
  if (!timeoutResult || (timeoutResult as { status?: string }).status !== "error") throw new Error("Timeout hook was not contained.");

  console.log(JSON.stringify({ status: "PASS", checks: ["incompatible", "invalid", "timeout"] }, null, 2));
} finally {
  await Promise.all([
    rm(incompatiblePath, { recursive: true, force: true }),
    rm(invalidPath, { recursive: true, force: true }),
    rm(timeoutPath, { recursive: true, force: true })
  ]);
}
