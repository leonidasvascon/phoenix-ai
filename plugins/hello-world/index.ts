import { definePlugin } from "@phoenix-ai/plugin-sdk";

export default definePlugin({
  manifest: {
    id: "hello-world",
    name: "Hello World",
    version: "1.0.0",
    engine: "^1.0.0",
    author: "Phoenix AI",
    capabilities: ["tool"],
    entry: "index.ts",
    description: "Example plugin that logs task hooks."
  },
  onLoad(context) {
    context.logger.info("Hello World plugin loaded.");
  },
  onEnable(context) {
    context.logger.info("Hello World plugin enabled.");
  },
  onDisable(context) {
    context.logger.info("Hello World plugin disabled.");
  },
  hooks: {
    beforeTask(payload, context) {
      context.logger.info("beforeTask received.", sanitizePayload(payload));
    },
    afterTask(payload, context) {
      context.logger.info("afterTask received.", sanitizePayload(payload));
    }
  }
});

function sanitizePayload(payload: unknown): Record<string, unknown> | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const task = (payload as { task?: unknown }).task;
  if (!task || typeof task !== "object") return undefined;
  return {
    brand: (task as { brand?: unknown }).brand,
    theme: (task as { theme?: unknown }).theme,
    format: (task as { format?: unknown }).format
  };
}
