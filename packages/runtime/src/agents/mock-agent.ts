import type { Agent, AgentInput, AgentOutput } from "../types.ts";

const mockOutputs: Record<string, (input: AgentInput) => AgentOutput> = {
  research: ({ task, brand }) => ({
    research: {
      theme: task.theme,
      brand: brand.brand.name,
      emotions: brand.emotions ?? [],
      insight: "Saudade performa melhor quando combina ausencia, desejo e uma frase de impacto logo no inicio."
    }
  }),

  hook_specialist: () => ({
    hook: "Ela nao foi embora por falta de amor..."
  }),

  story_writer: ({ task }) => ({
    story:
      `Ela foi embora porque amar tambem cansava. ${task.theme} virou silencio, e o silencio virou memoria.`,
    ending: "No fim, algumas pessoas nao somem. Elas ficam onde a gente nao consegue apagar.",
    caption: "Nem toda ausencia significa fim. Algumas viram marca.",
    hashtags: ["#saudade", "#desejo", "#encantointenso"],
    video_prompt:
      "Cinematic dark realistic scene, slow camera movement, intimate mood, emotional silence, subtle light, no explicit content.",
    thumbnail_prompt:
      "Dark cinematic close-up, elegant typography, emotional expression, subtle contrast.",
    cta: "Salve se isso ja teve nome na sua vida."
  }),

  reviewer: () => ({
    score: 95,
    review: {
      approved: true,
      reason: "O conteudo esta alinhado ao tom elegante, emocional e cinematografico da marca."
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
