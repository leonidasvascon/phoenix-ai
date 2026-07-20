import type { LlmProvider, LlmProviderResponse, LlmRequest } from "./llm-provider.ts";

const mockOutputs: Record<string, Record<string, unknown>> = {
  research: {
    research: {
      emotions: ["saudade", "desejo", "silêncio"],
      insight: "Saudade performa melhor quando combina ausência, desejo e uma frase de impacto logo no início.",
      risks: ["clichê", "frase pronta"]
    }
  },

  hook_specialist: {
    hook: "Ela não foi embora por falta de amor..."
  },

  story_writer: {
    story: "Ela foi embora porque amar também cansava. Saudade virou silêncio, e o silêncio virou memória.",
    ending: "No fim, algumas pessoas não somem. Elas ficam onde a gente não consegue apagar.",
    caption: "Nem toda ausência significa fim. Algumas viram marca.",
    hashtags: ["#saudade", "#desejo", "#encantointenso"],
    video_prompt:
      "Cinematic dark realistic scene, slow camera movement, intimate mood, emotional silence, subtle light, no explicit content.",
    thumbnail_prompt:
      "Dark cinematic close-up, elegant typography, emotional expression, subtle contrast.",
    cta: "Salve se isso já teve nome na sua vida."
  },

  reviewer: {
    score: 95,
    review: {
      approved: true,
      reason: "O conteúdo está alinhado ao tom elegante, emocional e cinematográfico da marca."
    }
  }
};

export class MockProvider implements LlmProvider {
  readonly id = "mock";

  async generateJson(request: LlmRequest): Promise<LlmProviderResponse> {
    const output = mockOutputs[request.agentId] ?? {
      [request.agentId]: {
        status: "mocked",
        message: `No mock output registered for ${request.agentId}.`
      }
    };

    return {
      output,
      model: "mock",
      usage: {
        input: 0,
        output: 0,
        total: 0
      },
      cost: {
        currency: "USD",
        estimated: 0
      }
    };
  }
}
