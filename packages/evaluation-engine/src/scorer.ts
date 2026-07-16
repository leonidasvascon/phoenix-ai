import { defaultRubric, normalizeRubric, type EvaluationDimension, type EvaluationRubric } from "./rubric.ts";

export type EvaluationInput = {
  brand?: Record<string, unknown>;
  output: Record<string, unknown>;
  task?: Record<string, unknown>;
};

export type EvaluationResult = {
  overall_score: number;
  dimensions: Record<EvaluationDimension, number>;
  passed: boolean;
  threshold: number;
  reasons: string[];
};

const cliches = ["frases prontas", "era uma vez", "voce nao vai acreditar", "link na bio", "curta e compartilhe"];
const emotionalWords = ["saudade", "desejo", "paixao", "silencio", "reencontro", "culpa", "esperanca", "memoria", "amor"];

export function scoreEvaluation(input: EvaluationInput, rubric: EvaluationRubric = defaultRubric, threshold = 90): EvaluationResult {
  const normalizedRubric = normalizeRubric(rubric);
  const text = flattenOutput(input.output);
  const hook = getString(input.output, "hook");
  const caption = getString(input.output, "caption");
  const dimensions: Record<EvaluationDimension, number> = {
    originality: scoreOriginality(text),
    clarity: scoreClarity(text, caption),
    hook_strength: scoreHook(hook),
    brand_alignment: scoreBrandAlignment(text, input.brand),
    emotional_impact: scoreEmotionalImpact(text)
  };
  const overall = Object.entries(dimensions).reduce((sum, [dimension, score]) => {
    return sum + score * normalizedRubric[dimension as EvaluationDimension].weight;
  }, 0);
  const overallScore = clamp(Math.round(overall));
  const reasons = Object.entries(dimensions)
    .filter(([, score]) => score < threshold)
    .map(([dimension, score]) => `${dimension} abaixo do limite: ${score}.`);

  return {
    overall_score: overallScore,
    dimensions,
    passed: overallScore >= threshold && reasons.length === 0,
    threshold,
    reasons
  };
}

function scoreOriginality(text: string): number {
  let score = 96;
  const lower = text.toLowerCase();
  const repeated = countRepeatedSentences(text);

  score -= repeated * 8;
  score -= cliches.filter((item) => lower.includes(item)).length * 10;

  return clamp(score);
}

function scoreClarity(text: string, caption: string): number {
  let score = 92;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount < 18) score -= 10;
  if (wordCount > 180) score -= 8;
  if (!caption) score -= 8;
  if (/[{}[\]]/.test(text)) score -= 6;

  return clamp(score);
}

function scoreHook(hook: string): number {
  if (!hook) return 70;

  let score = 88;
  const words = hook.split(/\s+/).filter(Boolean);

  if (words.length >= 5 && words.length <= 18) score += 6;
  if (hook.includes("?")) score += 4;
  if (/(nao|nunca|quando|porque|faltou|foi embora)/i.test(hook)) score += 4;
  if (words.length > 24) score -= 10;

  return clamp(score);
}

function scoreBrandAlignment(text: string, brand?: Record<string, unknown>): number {
  let score = 94;
  const lower = text.toLowerCase();
  const avoid = Array.isArray(brand?.avoid) ? brand?.avoid.map(String) : ["vulgar", "pornografia", "violencia", "cliche"];

  for (const forbidden of avoid) {
    if (lower.includes(forbidden.toLowerCase())) score -= 15;
  }

  if (/(saudade|desejo|paixao|silencio|reencontro)/i.test(text)) score += 3;

  return clamp(score);
}

function scoreEmotionalImpact(text: string): number {
  let score = 82;
  const lower = text.toLowerCase();
  const matches = emotionalWords.filter((word) => lower.includes(word)).length;

  score += Math.min(matches * 4, 16);
  if (/(ela|ele|voce|a gente|memoria|ausencia)/i.test(text)) score += 4;

  return clamp(score);
}

function flattenOutput(output: Record<string, unknown>): string {
  return ["hook", "story", "ending", "caption", "cta"]
    .map((key) => getString(output, key))
    .filter(Boolean)
    .join(" ");
}

function getString(output: Record<string, unknown>, key: string): string {
  const value = output[key];

  return typeof value === "string" ? value.trim() : "";
}

function countRepeatedSentences(text: string): number {
  const sentences = text
    .toLowerCase()
    .split(/[.!?]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 12);
  const unique = new Set(sentences);

  return sentences.length - unique.size;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
