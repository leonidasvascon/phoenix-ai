import type { AgentOutput, Brand, ExecutionContext, PipelineStep, Task } from "../types.ts";
import type { LlmProvider } from "../providers/llm-provider.ts";
import { MockProvider } from "../providers/mock-provider.ts";
import { OpenAIProvider } from "../providers/openai-provider.ts";
import { PromptAgent } from "./prompt-agent.ts";
import { logStep } from "../utils/logger.ts";
import { runQualityGate } from "../quality/quality-gate.ts";
import { defaultRetryPolicy, shouldRetry } from "../quality/retry-policy.ts";

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

    for (let attempt = 1; attempt <= defaultRetryPolicy.maxAttempts; attempt += 1) {
      context.quality.attempts = Math.max(context.quality.attempts, attempt);

      try {
        const rawOutput = await primaryAgent.execute({
          task,
          brand,
          context
        });
        const gate = runQualityGate(agentId, rawOutput, defaultRetryPolicy.minScore);

        if (gate.passed && gate.output) {
          context.quality.final_score =
            context.quality.final_score === 0 ? gate.score : Math.min(context.quality.final_score, gate.score);
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

    const fallbackOutput = await new PromptAgent(agentId, this.fallbackProvider).execute({
      task,
      brand,
      context
    });
    const fallbackGate = runQualityGate(agentId, fallbackOutput, 0);

    if (!fallbackGate.output) {
      throw new Error(`Fallback provider returned invalid output for ${agentId}.`);
    }

    context.quality.final_score =
      context.quality.final_score === 0 ? fallbackGate.score : Math.min(context.quality.final_score, fallbackGate.score);

    return fallbackGate.output;
  }
}
