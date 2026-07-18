import { createDefaultModelOrchestrator } from "@phoenix-ai/model-orchestrator";
import type { LlmProvider, LlmProviderResponse, LlmRequest } from "./llm-provider.ts";

export class OrchestratedProvider implements LlmProvider {
  readonly id = "model-orchestrator";

  async generateJson(request: LlmRequest): Promise<LlmProviderResponse> {
    const response = await createDefaultModelOrchestrator().generate({
      task_type: "agent",
      agent_id: request.agentId,
      messages: request.messages,
      temperature: request.temperature,
      response_format: "json",
      policy: process.env.PHOENIX_MODEL_POLICY as never
    });

    if (!response.output) {
      throw new Error("Model orchestrator did not return JSON output.");
    }

    return {
      output: response.output,
      model: `${response.provider_id}:${response.model}`,
      usage: response.usage,
      cost: response.cost
    };
  }
}
