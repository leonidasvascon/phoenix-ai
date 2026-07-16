export type EvaluationDimension = "brand_alignment" | "clarity" | "emotional_impact" | "hook_strength" | "originality";

export type EvaluationRubric = Record<EvaluationDimension, {
  description: string;
  weight: number;
}>;

export const defaultRubric: EvaluationRubric = {
  originality: {
    description: "Evita frases prontas, repeticao obvia e lugares-comuns.",
    weight: 0.25
  },
  clarity: {
    description: "A mensagem e compreensivel, direta e sem ruido estrutural.",
    weight: 0.2
  },
  hook_strength: {
    description: "Os primeiros segundos criam curiosidade e retencao.",
    weight: 0.2
  },
  brand_alignment: {
    description: "O conteudo respeita tom, emocoes e restricoes da marca.",
    weight: 0.2
  },
  emotional_impact: {
    description: "O conteudo desperta tensao emocional, desejo, memoria ou reflexao.",
    weight: 0.15
  }
};

export function normalizeRubric(rubric: EvaluationRubric = defaultRubric): EvaluationRubric {
  const total = Object.values(rubric).reduce((sum, item) => sum + item.weight, 0) || 1;

  return Object.fromEntries(
    Object.entries(rubric).map(([dimension, item]) => [
      dimension,
      {
        ...item,
        weight: item.weight / total
      }
    ])
  ) as EvaluationRubric;
}
