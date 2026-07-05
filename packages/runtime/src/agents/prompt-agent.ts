import type { Agent, AgentInput, AgentOutput } from "../types.ts";
import type { LlmProvider } from "../providers/llm-provider.ts";
import { loadPrompt } from "../loaders/prompt-loader.ts";

function buildUserPayload(input: AgentInput): string {
  return JSON.stringify(
    {
      task: input.task,
      brand: input.brand,
      previous_outputs: input.context.outputs
    },
    null,
    2
  );
}

export class PromptAgent implements Agent {
  readonly id: string;
  private readonly provider: LlmProvider;

  constructor(id: string, provider: LlmProvider) {
    this.id = id;
    this.provider = provider;
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const prompt = await loadPrompt(this.id);

    return this.provider.generateJson({
      agentId: this.id,
      messages: [
        {
          role: "system",
          content: `${prompt}\n\nReturn only valid JSON. Do not include markdown fences.`
        },
        {
          role: "user",
          content: buildUserPayload(input)
        }
      ]
    });
  }
}

