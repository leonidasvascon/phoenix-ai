import { randomUUID } from "node:crypto";
import type { ExecutionContext, RuntimeResponse, Task } from "./types.ts";
import { loadBrand } from "./loaders/brand-loader.ts";
import { loadPipeline } from "./loaders/pipeline-loader.ts";
import { AgentRegistry } from "./registry/agent-registry.ts";
import { logStep } from "./utils/logger.ts";

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
  static async execute(task: Task): Promise<RuntimeResponse> {
    const context: ExecutionContext = {
      executionId: randomUUID(),
      startedAt: performance.now(),
      task: {
        language: "pt-BR",
        ...task
      },
      logs: [],
      outputs: {}
    };

    try {
      validateTask(context.task);
      logStep(context, "task_validator", "success", "Task validated.");

      context.brand = await loadBrand(context.task.brand);
      logStep(context, "brand_loader", "success", `Brand loaded: ${context.brand.brand.id}.`);

      context.pipeline = await loadPipeline(context.task.format);
      logStep(context, "pipeline_loader", "success", `Pipeline loaded: ${context.pipeline.name}.`);

      const agentSteps = context.pipeline.steps.filter((step) => step.type === "agent");
      const registry = AgentRegistry.withMockAgents(
        agentSteps.map((step) => step.agent ?? step.id)
      );

      for (const step of agentSteps) {
        const agentId = step.agent ?? step.id;
        const agent = registry.get(agentId);
        const result = await agent.execute({
          task: context.task,
          brand: context.brand,
          context
        });

        context.outputs = {
          ...context.outputs,
          ...result
        };

        logStep(context, agentId, "success", `Agent executed: ${agentId}.`);
      }

      const executionTime = Number(((performance.now() - context.startedAt) / 1000).toFixed(3));
      const score = typeof context.outputs.score === "number" ? context.outputs.score : 0;

      return {
        status: "success",
        execution_id: context.executionId,
        execution_time: executionTime,
        pipeline: agentSteps.map((step) => step.agent ?? step.id),
        score,
        output: pickOutputFields(context.outputs, context.pipeline.outputFields),
        logs: context.logs
      };
    } catch (error) {
      const executionTime = Number(((performance.now() - context.startedAt) / 1000).toFixed(3));
      const message = error instanceof Error ? error.message : "Unknown runtime error.";
      logStep(context, "runtime", "error", message);

      return {
        status: "error",
        execution_id: context.executionId,
        execution_time: executionTime,
        pipeline: context.pipeline?.steps.map((step) => step.agent ?? step.id) ?? [],
        score: 0,
        output: {
          error: message
        },
        logs: context.logs
      };
    }
  }
}

