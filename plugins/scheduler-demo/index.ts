import { definePlugin } from "@phoenix-ai/plugin-sdk";

export default definePlugin({
  manifest: {
    id: "scheduler-demo",
    name: "Scheduler Demo",
    version: "1.0.0",
    engine: "^1.0.0",
    author: "Phoenix AI",
    capabilities: ["scheduler"],
    entry: "index.ts",
    description: "Example scheduler extension."
  },
  hooks: {
    beforeScheduler(_payload, context) {
      context.logger.info("Scheduler cycle starting.");
    },
    afterScheduler(_payload, context) {
      context.logger.info("Scheduler cycle finished.");
    }
  }
});
