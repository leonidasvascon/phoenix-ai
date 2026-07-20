import type { AgentOutput, Brand, ExecutionContext, PipelineStep, Task } from "../types.ts";
import type { LlmProvider } from "../providers/llm-provider.ts";
import { MockProvider } from "../providers/mock-provider.ts";
import { OpenAIProvider } from "../providers/openai-provider.ts";
import { OrchestratedProvider } from "../providers/orchestrated-provider.ts";
import { PromptAgent } from "./prompt-agent.ts";
import { logStep } from "../utils/logger.ts";
import { runQualityGate } from "../quality/quality-gate.ts";
import { defaultRetryPolicy, shouldRetry } from "../quality/retry-policy.ts";
import { addCostUsage } from "../execution/cost-tracker.ts";
import { recordAgentExecution } from "../execution/execution-log.ts";
import { addTokenUsage } from "../execution/token-tracker.ts";
import type { RetryPolicy } from "../quality/retry-policy.ts";
import { incrementCounter, logStructured, recordGauge, withSpan } from "@phoenix-ai/observability";

function selectProvider(provider = process.env.PHOENIX_PROVIDER ?? "mock"): LlmProvider {
  if (provider === "orchestrator" || provider === "model-orchestrator" || process.env.PHOENIX_MODEL_ORCHESTRATOR === "true") {
    return new OrchestratedProvider();
  }

  if (provider === "openai") {
    return new OpenAIProvider();
  }

  return new MockProvider();
}

export class AgentRunner {
  private readonly primaryProvider: LlmProvider;
  private readonly fallbackProvider: LlmProvider;
  private readonly retryPolicy: RetryPolicy;
  private readonly fallbackPolicy: string;

  constructor(
    options: { provider?: string; retryPolicy?: RetryPolicy } = {},
    fallbackProvider = new MockProvider()
  ) {
    const primaryProvider = selectProvider(options.provider);
    this.primaryProvider = primaryProvider;
    this.fallbackProvider = fallbackProvider;
    this.retryPolicy = options.retryPolicy ?? defaultRetryPolicy;
    this.fallbackPolicy = process.env.PHOENIX_LLM_FALLBACK_POLICY ?? "retry_then_mock";
  }

  async run(step: PipelineStep, task: Task, brand: Brand, context: ExecutionContext): Promise<AgentOutput> {
    const agentId = step.agent ?? step.id;
    return withSpan("phoenix.agent.execute", {
      "phoenix.execution.id": context.executionId,
      "phoenix.brand.id": brand.brand.id,
      "phoenix.task.format": task.format,
      "phoenix.task.platform": task.platform,
      "phoenix.agent.name": agentId,
      "phoenix.provider.requested": this.primaryProvider.id
    }, async () => this.runWithSpan(agentId, task, brand, context));
  }

  private async runWithSpan(agentId: string, task: Task, brand: Brand, context: ExecutionContext): Promise<AgentOutput> {
    const primaryAgent = new PromptAgent(agentId, this.primaryProvider);
    const startedAt = performance.now();
    let agentAttempts = 0;
    let lastScore = 0;

    for (let attempt = 1; attempt <= this.retryPolicy.maxAttempts; attempt += 1) {
      context.quality.attempts = Math.max(context.quality.attempts, attempt);
      agentAttempts = attempt;

      try {
        const rawOutput = await primaryAgent.execute({
          task,
          brand,
          context
        });
        const gate = runQualityGate(agentId, rawOutput, this.retryPolicy.minScore);
        lastScore = gate.score;
        addTokenUsage(context.execution.tokens, primaryAgent.lastUsage);
        addCostUsage(context.execution.cost, primaryAgent.lastCost);

        if (gate.passed && gate.output) {
          context.quality.final_score =
            context.quality.final_score === 0 ? gate.score : Math.min(context.quality.final_score, gate.score);
          recordAgentExecution(context, {
            name: agentId,
            status: "success",
            provider: this.primaryProvider.id,
            attempts: agentAttempts,
            duration_ms: Math.round(performance.now() - startedAt),
            score: gate.score,
            tokens: primaryAgent.lastUsage,
            cost: primaryAgent.lastCost
          });
          incrementCounter("phoenix_agent_executions_total", {
            agent: agentId,
            provider: this.primaryProvider.id,
            result: "success"
          });
          recordGauge("phoenix_quality_score", gate.score, {
            agent: agentId,
            format: task.format,
            platform: task.platform
          });
          return gate.output;
        }

        const reason = gate.reason ?? `Score below ${this.retryPolicy.minScore}.`;
        logStep(context, agentId, "error", `Quality gate failed on attempt ${attempt}: ${reason}`);

        if (!shouldRetry(attempt, gate.score, this.retryPolicy)) {
          context.quality.failed_agents.push({
            agent: agentId,
            reason
          });
          incrementCounter("phoenix_agent_failures_total", {
            agent: agentId,
            provider: this.primaryProvider.id,
            result: "quality_failed"
          });
          break;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown provider error.";
        logStep(context, agentId, "error", `Provider ${this.primaryProvider.id} failed on attempt ${attempt}. ${message}`);

        if (!shouldRetry(attempt, 0, this.retryPolicy)) {
          context.quality.failed_agents.push({
            agent: agentId,
            reason: message
          });
          incrementCounter("phoenix_agent_failures_total", {
            agent: agentId,
            provider: this.primaryProvider.id,
            result: "provider_failed"
          });
          break;
        }
      }
    }

    if (this.fallbackPolicy === "disabled") {
      const message = `Provider ${this.primaryProvider.id} failed and fallback policy is disabled.`;
      logStep(context, agentId, "error", message);
      throw new Error(message);
    }

    logStep(
      context,
      agentId,
      "error",
      `Falling back to ${this.fallbackProvider.id} after quality/provider failure.`
    );
    incrementCounter("phoenix_provider_fallbacks_total", {
      agent: agentId,
      provider: this.primaryProvider.id,
      result: "fallback"
    });
    logStructured("warn", "provider.fallback.activated", {
      execution_id: context.executionId,
      agent: agentId,
      requested_provider: this.primaryProvider.id,
      effective_provider: this.fallbackProvider.id
    });

    const fallbackAgent = new PromptAgent(agentId, this.fallbackProvider);
    const fallbackOutput = await fallbackAgent.execute({
      task,
      brand,
      context
    });
    const fallbackGate = runQualityGate(agentId, fallbackOutput, 0);

    if (!fallbackGate.output) {
      throw new Error(`Fallback provider returned invalid output for ${agentId}.`);
    }

    addTokenUsage(context.execution.tokens, fallbackAgent.lastUsage);
    addCostUsage(context.execution.cost, fallbackAgent.lastCost);
    context.quality.final_score =
      context.quality.final_score === 0 ? fallbackGate.score : Math.min(context.quality.final_score, fallbackGate.score);
    recordAgentExecution(context, {
      name: agentId,
      status: "success",
      provider: this.fallbackProvider.id,
      attempts: agentAttempts,
      duration_ms: Math.round(performance.now() - startedAt),
      score: fallbackGate.score || lastScore,
      tokens: fallbackAgent.lastUsage,
      cost: fallbackAgent.lastCost
    });
    incrementCounter("phoenix_agent_executions_total", {
      agent: agentId,
      provider: this.fallbackProvider.id,
      result: "fallback_success"
    });

    return fallbackGate.output;
  }
}
