import type { AgentOutput, Brand, ExecutionContext, PipelineStep, Task } from "../types.ts";
import type { LlmProvider } from "../providers/llm-provider.ts";
import { MockProvider } from "../providers/mock-provider.ts";
import { OpenAIProvider } from "../providers/openai-provider.ts";
import { PromptAgent } from "./prompt-agent.ts";
import { logStep } from "../utils/logger.ts";

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

    try {
      return await new PromptAgent(agentId, this.primaryProvider).execute({
        task,
        brand,
        context
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown provider error.";
      context.outputs[`${agentId}_provider_error`] = message;
      logStep(
        context,
        agentId,
        "error",
        `Provider ${this.primaryProvider.id} failed; falling back to ${this.fallbackProvider.id}. ${message}`
      );

      return new PromptAgent(agentId, this.fallbackProvider).execute({
        task,
        brand,
        context
      });
    }
  }
}
