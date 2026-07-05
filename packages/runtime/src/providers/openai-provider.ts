import type { LlmProvider, LlmProviderResponse, LlmRequest } from "./llm-provider.ts";
import { estimateCost } from "../execution/cost-tracker.ts";

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function extractJson(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("OpenAI response did not contain JSON.");
    }
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

export class OpenAIProvider implements LlmProvider {
  readonly id = "openai";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(options?: { apiKey?: string; model?: string }) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.model = options?.model ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  }

  async generateJson(request: LlmRequest): Promise<LlmProviderResponse> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        temperature: request.temperature ?? 0.7,
        response_format: {
          type: "json_object"
        },
        messages: request.messages
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as OpenAIChatResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI response was empty.");
    }

    const usage = {
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
      total: data.usage?.total_tokens ?? 0
    };

    return {
      output: extractJson(content),
      model: this.model,
      usage,
      cost: estimateCost(this.id, this.model, usage)
    };
  }
}
