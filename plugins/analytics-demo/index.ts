import { definePlugin } from "@phoenix-ai/plugin-sdk";

export default definePlugin({
  manifest: {
    id: "analytics-demo",
    name: "Analytics Demo",
    version: "1.0.0",
    engine: "^1.0.0",
    author: "Phoenix AI",
    capabilities: ["analytics"],
    entry: "index.ts",
    description: "Example analytics extension that observes completed tasks."
  },
  hooks: {
    afterTask(payload, context) {
      const score = payload && typeof payload === "object" ? (payload as { result?: { score?: unknown } }).result?.score : undefined;
      context.metrics.increment("analytics_demo_after_task_total");
      context.logger.info("Analytics demo observed task completion.", { score });
    }
  }
});
