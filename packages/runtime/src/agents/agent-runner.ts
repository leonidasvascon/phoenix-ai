import type { AgentOutput, Brand, ExecutionContext, PipelineStep, Task } from "../types.ts";
import type { LlmProvider } from "../providers/llm-provider.ts";
import { MockProvider } from "../providers/mock-provider.ts";
import { OpenAIProvider } from "../providers/openai-provider.ts";
import { PromptAgent } from "./prompt-agent.ts";
import { logStep } from "../utils/logger.ts";
import { runQualityGate } from "../quality/quality-gate.ts";
import { defaultRetryPolicy, shouldRetry } from "../quality/retry-policy.ts";
import { addCostUsage } from "../execution/cost-tracker.ts";
import { recordAgentExecution } from "../execution/execution-log.ts";
import { addTokenUsage } from "../execution/token-tracker.ts";

function selectProvider(): LlmProvider {
  const provider = process.env.PHOENIX_PROVIDER ?? "mock";

  if (provider === "openai") {
    return new OpenAIProvider();
  }

  return new MockProvider();
}

export class AgentRunner {
  private readonly primaryProvider: LlmProvider;
  private readonly fallbackProvider: LlmProvider;

  constructor(primaryProvider = selectProvider(), fallbackProvider = new MockProvider()) {
    this.primaryProvider = primaryProvider;
    this.fallbackProvider = fallbackProvider;
  }

  async run(step: PipelineStep, task: Task, brand: Brand, context: ExecutionContext): Promise<AgentOutput> {
    const agentId = step.agent ?? step.id;
    const primaryAgent = new PromptAgent(agentId, this.primaryProvider);
    const startedAt = performance.now();
    let agentAttempts = 0;
    let lastScore = 0;

    for (let attempt = 1; attempt <= defaultRetryPolicy.maxAttempts; attempt += 1) {
      context.quality.attempts = Math.max(context.quality.attempts, attempt);
      agentAttempts = attempt;

      try {
        const rawOutput = await primaryAgent.execute({
          task,
          brand,
          context
        });
        const gate = runQualityGate(agentId, rawOutput, defaultRetryPolicy.minScore);
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
          return gate.output;
        }

        const reason = gate.reason ?? `Score below ${defaultRetryPolicy.minScore}.`;
        logStep(context, agentId, "error", `Quality gate failed on attempt ${attempt}: ${reason}`);

        if (!shouldRetry(attempt, gate.score)) {
          context.quality.failed_agents.push({
            agent: agentId,
            reason
          });
          break;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown provider error.";
        logStep(context, agentId, "error", `Provider ${this.primaryProvider.id} failed on attempt ${attempt}. ${message}`);

        if (!shouldRetry(attempt, 0)) {
          context.quality.failed_agents.push({
            agent: agentId,
            reason: message
          });
          break;
        }
      }
    }

    logStep(
      context,
      agentId,
      "error",
      `Falling back to ${this.fallbackProvider.id} after quality/provider failure.`
    );

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

    return fallbackGate.output;
  }
}
