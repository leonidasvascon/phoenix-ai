import type { LlmProvider, LlmRequest } from "./llm-provider.ts";

const mockOutputs: Record<string, Record<string, unknown>> = {
  research: {
    research: {
      emotions: ["saudade", "desejo", "silencio"],
      insight: "Saudade performa melhor quando combina ausencia, desejo e uma frase de impacto logo no inicio.",
      risks: ["cliche", "frase pronta"]
    }
  },

  hook_specialist: {
    hook: "Ela nao foi embora por falta de amor..."
  },

  story_writer: {
    story: "Ela foi embora porque amar tambem cansava. Saudade virou silencio, e o silencio virou memoria.",
    ending: "No fim, algumas pessoas nao somem. Elas ficam onde a gente nao consegue apagar.",
    caption: "Nem toda ausencia significa fim. Algumas viram marca.",
    hashtags: ["#saudade", "#desejo", "#encantointenso"],
    video_prompt:
      "Cinematic dark realistic scene, slow camera movement, intimate mood, emotional silence, subtle light, no explicit content.",
    thumbnail_prompt:
      "Dark cinematic close-up, elegant typography, emotional expression, subtle contrast.",
    cta: "Salve se isso ja teve nome na sua vida."
  },

  reviewer: {
    score: 95,
    review: {
      approved: true,
      reason: "O conteudo esta alinhado ao tom elegante, emocional e cinematografico da marca."
    }
  }
};

export class MockProvider implements LlmProvider {
  readonly id = "mock";

  async generateJson(request: LlmRequest): Promise<Record<string, unknown>> {
    return mockOutputs[request.agentId] ?? {
      [request.agentId]: {
        status: "mocked",
        message: `No mock output registered for ${request.agentId}.`
      }
    };
  }
}

