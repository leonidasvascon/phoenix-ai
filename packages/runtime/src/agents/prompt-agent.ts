import type { Agent, AgentInput, AgentOutput, CostUsage, TokenUsage } from "../types.ts";
import type { LlmProvider } from "../providers/llm-provider.ts";
import { loadPrompt } from "../loaders/prompt-loader.ts";

function buildUserPayload(input: AgentInput, agentId: string): string {
  return JSON.stringify(
    {
      task: input.task,
      brand: input.brand,
      knowledge: input.context.knowledge,
      memory: input.context.memory,
      learning_recommendations: input.context.learning_recommendations,
      prompt_optimizations: input.context.prompt_optimizations.filter(
        (optimization) => optimization.active && (optimization.agent === agentId || optimization.agent === "global")
      ),
      previous_outputs: input.context.outputs
    },
    null,
    2
  );
}

export class PromptAgent implements Agent {
  readonly id: string;
  private readonly provider: LlmProvider;
  lastUsage: TokenUsage = {
    input: 0,
    output: 0,
    total: 0
  };
  lastCost: CostUsage = {
    currency: "USD",
    estimated: 0
  };
  lastModel = "";

  constructor(id: string, provider: LlmProvider) {
    this.id = id;
    this.provider = provider;
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const prompt = await loadPrompt(this.id);

    const response = await this.provider.generateJson({
      agentId: this.id,
      messages: [
        {
          role: "system",
          content: `${prompt}\n\nReturn only valid JSON. Do not include markdown fences.`
        },
        {
          role: "user",
          content: buildUserPayload(input, this.id)
        }
      ]
    });

    this.lastUsage = response.usage;
    this.lastCost = response.cost;
    this.lastModel = response.model ?? "";

    return response.output;
  }
}
