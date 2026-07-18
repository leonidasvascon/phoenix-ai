import type { RuntimeOptions, RuntimeResponse, Task } from "./types.ts";
import { KnowledgeRetriever } from "@phoenix-ai/knowledge-graph";
import { loadBrand } from "./loaders/brand-loader.ts";
import { loadKnowledge } from "./loaders/knowledge-loader.ts";
import { loadPipeline } from "./loaders/pipeline-loader.ts";
import { AgentRunner } from "./agents/agent-runner.ts";
import { logStep } from "./utils/logger.ts";
import { createExecutionContext } from "./execution/execution-context.ts";
import { FilePersistenceAdapter } from "./persistence/file-persistence-adapter.ts";
import type { PersistenceAdapter } from "./persistence/persistence-adapter.ts";
import { FileMemoryStore, retrieveMemory, writeMemory } from "../../memory-engine/src/index.ts";
import { incrementCounter, logStructured, recordDuration, recordGauge, withObservabilityContext, withSpan } from "@phoenix-ai/observability";

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

function getStorytellingIds(context: { knowledge?: { by_category: Record<string, Array<{ id: string }>> } }): string[] {
  return context.knowledge?.by_category.storytelling?.map((document) => document.id) ?? [];
}

export class Runtime {
  static async execute(
    task: Task,
    persistence: PersistenceAdapter = new FilePersistenceAdapter(),
    options: RuntimeOptions = {}
  ): Promise<RuntimeResponse> {
    return withSpan("phoenix.runtime.execute", {
      "phoenix.brand.id": task.brand,
      "phoenix.task.format": task.format,
      "phoenix.task.platform": task.platform
    }, async () => {
      const context = createExecutionContext(task);
      const provider = options.provider ?? process.env.PHOENIX_PROVIDER ?? "mock";

      return withObservabilityContext({ execution_id: context.executionId }, async () => {
        try {
          logStructured("info", "runtime.execution.started", {
            execution_id: context.executionId,
            brand_id: context.task.brand,
            format: context.task.format,
            platform: context.task.platform
          });
      validateTask(context.task);
      logStep(context, "task_validator", "success", "Task validated.");
      context.learning_recommendations = options.learningRecommendations ?? [];
      context.prompt_optimizations = options.promptOptimizations ?? [];

      context.brand = await withSpan("phoenix.brand.load", {
        "phoenix.execution.id": context.executionId,
        "phoenix.brand.id": context.task.brand
      }, () => loadBrand(context.task.brand));
      logStep(context, "brand_loader", "success", `Brand loaded: ${context.brand.brand.id}.`);

      context.knowledge = await withSpan("phoenix.knowledge.retrieve", {
        "phoenix.execution.id": context.executionId,
        "phoenix.brand.id": context.brand.brand.id
      }, () => loadKnowledge(context.task, context.brand!));
      logStep(context, "knowledge_loader", "success", `Knowledge loaded: ${context.knowledge.documents.length} documents.`);

      context.knowledge_graph = await withSpan("phoenix.knowledge_graph.retrieve", {
        "phoenix.execution.id": context.executionId,
        "phoenix.brand.id": context.brand.brand.id
      }, async () => {
        try {
          const retriever = new KnowledgeRetriever();
          return await retriever.search({
            query: `${context.brand!.brand.name} ${context.task.theme} ${context.task.objective} ${context.task.format}`,
            limit: 6
          });
        } catch (error) {
          return {
            query: context.task.theme,
            results: [],
            error: error instanceof Error ? error.message : "Knowledge graph unavailable."
          };
        }
      });
      logStep(context, "knowledge_graph", "success", "Hybrid RAG context loaded.");

      const memoryStore = new FileMemoryStore();
      context.memory = await withSpan("phoenix.memory.load", {
        "phoenix.execution.id": context.executionId,
        "phoenix.brand.id": context.brand.brand.id
      }, () => retrieveMemory(memoryStore, context.brand!.brand.id));
      logStep(context, "memory_loader", "success", `Memory loaded for brand: ${context.memory.brand_id}.`);

      context.pipeline = await loadPipeline(context.task.format);
      logStep(context, "pipeline_loader", "success", `Pipeline loaded: ${context.pipeline.name}.`);

      const agentSteps = context.pipeline.steps.filter((step) => step.type === "agent");
      const runner = new AgentRunner({
        provider,
        retryPolicy: {
          maxAttempts: options.quality?.maxAttempts ?? 2,
          minScore: options.quality?.minScore ?? 90
        }
      });

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
      await withSpan("phoenix.quality.evaluate", {
        "phoenix.execution.id": context.executionId,
        "phoenix.quality.score": score || context.quality.final_score
      }, async () => {
        context.quality.final_score = score || context.quality.final_score;
        context.quality.passed = context.quality.failed_agents.length === 0;
        recordGauge("phoenix_quality_score", context.quality.final_score, {
          format: context.task.format,
          platform: context.task.platform
        });
        if (!context.quality.passed) {
          logStructured("warn", "quality.gate.failed", {
            execution_id: context.executionId,
            score: context.quality.final_score,
            failed_agents: context.quality.failed_agents.length
          });
        }
      });
      context.execution.duration_ms = Math.round(performance.now() - context.startedAt);
      context.execution.provider = provider;
      context.execution.task = context.task;
      context.memory = await writeMemory(memoryStore, {
        memory: context.memory,
        execution_id: context.executionId,
        theme: context.task.theme,
        format: context.task.format,
        output: context.outputs,
        score: context.quality.final_score,
        storytelling: getStorytellingIds(context)
      });
      logStep(context, "memory_writer", "success", `Memory updated for brand: ${context.memory.brand_id}.`);

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

      const persistenceResult = await withSpan("phoenix.execution.persist", {
        "phoenix.execution.id": context.executionId
      }, () => persistence.saveExecution(response));
      response.execution.persisted = persistenceResult.persisted;
      response.execution.storage = persistenceResult.storage;
      incrementCounter("phoenix_runtime_executions_total", {
        format: context.task.format,
        platform: context.task.platform,
        result: "success"
      });
      recordDuration("phoenix_runtime_duration_ms", context.execution.duration_ms, {
        format: context.task.format,
        platform: context.task.platform
      });
      logStructured("info", "runtime.execution.completed", {
        execution_id: context.executionId,
        duration_ms: context.execution.duration_ms,
        status: "success"
      });

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
      incrementCounter("phoenix_runtime_executions_total", {
        format: context.task.format,
        platform: context.task.platform,
        result: "error"
      });
      logStructured("error", "runtime.execution.completed", {
        execution_id: context.executionId,
        duration_ms: context.execution.duration_ms,
        status: "error",
        error: message
      });

      return response;
    }
      });
    });
  }
}
