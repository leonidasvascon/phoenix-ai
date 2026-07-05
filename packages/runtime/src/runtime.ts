import type { RuntimeResponse, Task } from "./types.ts";
import { loadBrand } from "./loaders/brand-loader.ts";
import { loadPipeline } from "./loaders/pipeline-loader.ts";
import { AgentRunner } from "./agents/agent-runner.ts";
import { logStep } from "./utils/logger.ts";
import { createExecutionContext } from "./execution/execution-context.ts";
import { FilePersistenceAdapter } from "./persistence/file-persistence-adapter.ts";
import type { PersistenceAdapter } from "./persistence/persistence-adapter.ts";

function validateTask(task: Task): void {
  const required: Array<keyof Task> = ["brand", "objective", "platform", "format", "theme"];

  for (const field of required) {
    if (!task[field]) {
      throw new Error(`Missing required task field: ${field}`);
    }
  }
}

function pickOutputFields(source: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const field of fields) {
    if (field in source) {
      output[field] = source[field];
    }
  }

  return output;
}

export class Runtime {
  static async execute(task: Task, persistence: PersistenceAdapter = new FilePersistenceAdapter()): Promise<RuntimeResponse> {
    const context = createExecutionContext(task);

    try {
      validateTask(context.task);
      logStep(context, "task_validator", "success", "Task validated.");

      context.brand = await loadBrand(context.task.brand);
      logStep(context, "brand_loader", "success", `Brand loaded: ${context.brand.brand.id}.`);

      context.pipeline = await loadPipeline(context.task.format);
      logStep(context, "pipeline_loader", "success", `Pipeline loaded: ${context.pipeline.name}.`);

      const agentSteps = context.pipeline.steps.filter((step) => step.type === "agent");
      const runner = new AgentRunner();

      for (const step of agentSteps) {
        const agentId = step.agent ?? step.id;
        const result = await runner.run(step, context.task, context.brand, context);

        context.outputs = {
          ...context.outputs,
          ...result
        };

        logStep(context, agentId, "success", `Agent executed: ${agentId}.`);
      }

      const executionTime = Number(((performance.now() - context.startedAt) / 1000).toFixed(3));
      const score = typeof context.outputs.score === "number" ? context.outputs.score : 0;
      context.quality.final_score = score || context.quality.final_score;
      context.quality.passed = context.quality.failed_agents.length === 0;
      context.execution.duration_ms = Math.round(performance.now() - context.startedAt);
      context.execution.provider = process.env.PHOENIX_PROVIDER ?? "mock";
      context.execution.task = context.task;

      const response: RuntimeResponse = {
        status: "success",
        execution_id: context.executionId,
        execution_time: executionTime,
        pipeline: agentSteps.map((step) => step.agent ?? step.id),
        score: context.quality.final_score,
        quality: context.quality,
        execution: context.execution,
        output: pickOutputFields(context.outputs, context.pipeline.outputFields),
        logs: context.logs
      };

      const persistenceResult = await persistence.saveExecution(response);
      response.execution.persisted = persistenceResult.persisted;
      response.execution.storage = persistenceResult.storage;

      return response;
    } catch (error) {
      const executionTime = Number(((performance.now() - context.startedAt) / 1000).toFixed(3));
      const message = error instanceof Error ? error.message : "Unknown runtime error.";
      context.execution.duration_ms = Math.round(performance.now() - context.startedAt);
      logStep(context, "runtime", "error", message);

      const response: RuntimeResponse = {
        status: "error",
        execution_id: context.executionId,
        execution_time: executionTime,
        pipeline: context.pipeline?.steps.map((step) => step.agent ?? step.id) ?? [],
        score: 0,
        quality: {
          ...context.quality,
          passed: false
        },
        execution: context.execution,
        output: {
          error: message
        },
        logs: context.logs
      };

      const persistenceResult = await persistence.saveExecution(response);
      response.execution.persisted = persistenceResult.persisted;
      response.execution.storage = persistenceResult.storage;

      return response;
    }
  }
}
