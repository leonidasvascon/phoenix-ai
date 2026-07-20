import type { Agent, AgentInput, AgentOutput } from "../types.ts";

const mockOutputs: Record<string, (input: AgentInput) => AgentOutput> = {
  research: ({ task, brand }) => ({
    research: {
      theme: task.theme,
      brand: brand.brand.name,
      emotions: brand.emotions ?? [],
      insight: "Saudade performa melhor quando combina ausência, desejo e uma frase de impacto logo no início."
    }
  }),

  hook_specialist: () => ({
    hook: "Ela não foi embora por falta de amor..."
  }),

  story_writer: ({ task }) => ({
    story:
      `Ela foi embora porque amar também cansava. ${task.theme} virou silêncio, e o silêncio virou memória.`,
    ending: "No fim, algumas pessoas não somem. Elas ficam onde a gente não consegue apagar.",
    caption: "Nem toda ausência significa fim. Algumas viram marca.",
    hashtags: ["#saudade", "#desejo", "#encantointenso"],
    video_prompt:
      "Cinematic dark realistic scene, slow camera movement, intimate mood, emotional silence, subtle light, no explicit content.",
    thumbnail_prompt:
      "Dark cinematic close-up, elegant typography, emotional expression, subtle contrast.",
    cta: "Salve se isso já teve nome na sua vida."
  }),

  reviewer: () => ({
    score: 95,
    review: {
      approved: true,
      reason: "O conteúdo está alinhado ao tom elegante, emocional e cinematográfico da marca."
    }
  })
};

export class MockAgent implements Agent {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const handler = mockOutputs[this.id];

    if (!handler) {
      return {
        [this.id]: {
          status: "mocked",
          message: `No mock output registered for ${this.id}.`
        }
      };
    }

    return handler(input);
  }
}
