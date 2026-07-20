import type { Brand, BrandMemory, ExecutionReport, QualityDimensions, Task } from "../types.ts";

export type ProductionSafetyGateInput = {
  task: Task;
  brand: Brand;
  output: Record<string, unknown>;
  memory?: BrandMemory;
  execution: ExecutionReport;
};

export type ProductionSafetyGateResult = {
  passed: boolean;
  publishable: boolean;
  overallScore: number;
  dimensions: QualityDimensions;
  rejectionReasons: string[];
};

const EMOTIONAL_TERMS = [
  "amor",
  "saudade",
  "desejo",
  "paixao",
  "silencio",
  "reencontro",
  "relacionamento",
  "vulnerabilidade",
  "emocao",
  "cuidado",
  "olhar",
  "gesto",
  "sentimento",
  "memoria"
];

const COMMERCIAL_TERMS = [
  "alta performance",
  "carreira",
  "corporativ",
  "conversao",
  "curso",
  "cliente",
  "desconto",
  "garanta sua vaga",
  "infoproduto",
  "lideranca",
  "matricula",
  "negocio",
  "oferta",
  "oportunidade unica",
  "produto",
  "promocao",
  "resultado garantido",
  "status profissional",
  "transforme sua carreira",
  "urgencia",
  "vagas limitadas",
  "venda agressiva"
];

const AGGRESSIVE_TERMS = [
  "compre agora",
  "domine",
  "garanta agora",
  "imperdivel",
  "nao perca",
  "ultimas vagas",
  "venda",
  "vença",
  "vire lider"
];

const SAFETY_TERMS = [
  "pornografia",
  "pornografico",
  "violencia",
  "violento",
  "linguagem vulgar",
  "nudez explicita"
];

const REQUIRED_FIELDS = ["hook", "story", "caption", "hashtags", "video_prompt", "thumbnail_prompt"];

export function evaluateProductionSafety(input: ProductionSafetyGateInput): ProductionSafetyGateResult {
  const content = normalizeText(joinContent(input.task, input.output));
  const brandRules = readBrandRules(input.brand);
  const structureScore = scoreStructure(input.output);
  const brandAlignmentScore = scoreBrandAlignment(content, brandRules);
  const toneScore = scoreTone(content);
  const originalityScore = scoreOriginality(content, input.memory);
  const safetyScore = scoreSafety(content);
  const publishReadinessScore = scorePublishReadiness(input.execution);
  const dimensions: QualityDimensions = {
    structureScore,
    brandAlignmentScore,
    toneScore,
    originalityScore,
    safetyScore,
    publishReadinessScore
  };
  const rejectionReasons = buildRejectionReasons(dimensions, content);
  const passed = rejectionReasons.length === 0;
  const publishable = passed && publishReadinessScore === 100;
  const scoreOriginalityForOverall = publishReadinessScore === 100 ? originalityScore : 100;
  const overallScore = Math.min(
    structureScore,
    brandAlignmentScore,
    toneScore,
    scoreOriginalityForOverall,
    safetyScore
  );

  return {
    passed,
    publishable,
    overallScore,
    dimensions,
    rejectionReasons
  };
}

function joinContent(task: Task, output: Record<string, unknown>): string {
  const values = [
    task.theme,
    task.objective,
    output.hook,
    output.story,
    output.ending,
    output.caption,
    output.cta,
    output.video_prompt,
    output.thumbnail_prompt,
    output.hashtags
  ];

  return values.flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

function readBrandRules(brand: Brand): string[] {
  const rules = [
    ...(brand.avoid ?? []),
    ...(brand.forbidden_patterns ?? []),
    ...readUnknownStringArray(brand.allowed),
    ...readUnknownStringArray(brand.disallowed)
  ];

  return rules.map(normalizeText);
}

function readUnknownStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function scoreStructure(output: Record<string, unknown>): number {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = output[field];
    if (Array.isArray(value)) return value.length === 0;
    return typeof value !== "string" || value.trim().length === 0;
  });

  return clamp(100 - missing.length * 15);
}

function scoreBrandAlignment(content: string, brandRules: string[]): number {
  const commercialHits = countHits(content, COMMERCIAL_TERMS);
  const ruleHits = countHits(content, brandRules.filter((rule) => COMMERCIAL_TERMS.some((term) => rule.includes(term))));
  const emotionalHits = countHits(content, EMOTIONAL_TERMS);
  const score = 100 - commercialHits * 14 - ruleHits * 12 + Math.min(emotionalHits * 3, 12);

  return clamp(score);
}

function scoreTone(content: string): number {
  const commercialHits = countHits(content, COMMERCIAL_TERMS);
  const aggressiveHits = countHits(content, AGGRESSIVE_TERMS);

  return clamp(100 - commercialHits * 8 - aggressiveHits * 14);
}

function scoreOriginality(content: string, memory?: BrandMemory): number {
  if (!memory) return 100;

  const previous = [
    ...memory.used_hooks,
    ...memory.used_ctas,
    ...memory.used_storytelling,
    ...memory.recent_outputs.flatMap((item) => [item.hook, item.cta])
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  let penalty = 0;
  for (const value of previous.slice(-30)) {
    const normalized = normalizeText(value);
    if (normalized.length < 12) continue;
    if (content.includes(normalized)) {
      penalty += 25;
      continue;
    }
    if (wordOverlap(content, normalized) > 0.82) {
      penalty += 12;
    }
  }

  return clamp(100 - penalty);
}

function scoreSafety(content: string): number {
  return countHits(content, SAFETY_TERMS) > 0 ? 0 : 100;
}

function scorePublishReadiness(execution: ExecutionReport): number {
  if (execution.provider === "mock") return 0;
  if (execution.agents.length === 0) return 0;
  if (execution.agents.some((agent) => agent.provider === "mock" || agent.status === "error")) return 0;

  return 100;
}

function buildRejectionReasons(dimensions: QualityDimensions, content: string): string[] {
  const reasons: string[] = [];

  if (dimensions.structureScore < 85) {
    reasons.push("Estrutura incompleta: o resultado não contém todos os campos essenciais do pacote.");
  }
  if (dimensions.brandAlignmentScore < 80) {
    reasons.push("Rejeitado por desalinhamento com o Brand DNA.");
  }
  if (dimensions.toneScore < 80) {
    reasons.push("Rejeitado por tom comercial, corporativo ou agressivo incompatível com a marca.");
  }
  if (dimensions.publishReadinessScore === 100 && dimensions.originalityScore < 75) {
    reasons.push("Rejeitado por baixa originalidade em relação à memória recente da marca.");
  }
  if (dimensions.safetyScore < 100) {
    reasons.push("Rejeitado por violar regras de segurança ou padrões proibidos.");
  }
  if (countHits(content, COMMERCIAL_TERMS) >= 3) {
    reasons.push("O conteúdo contém muitos sinais de venda agressiva ou linguagem de infoproduto.");
  }

  return Array.from(new Set(reasons));
}

function countHits(content: string, terms: string[]): number {
  return terms.reduce((total, term) => total + (content.includes(normalizeText(term)) ? 1 : 0), 0);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.split(/\W+/).filter((word) => word.length > 3));
  const wordsB = new Set(b.split(/\W+/).filter((word) => word.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = [...wordsA].filter((word) => wordsB.has(word)).length;
  return intersection / Math.min(wordsA.size, wordsB.size);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
