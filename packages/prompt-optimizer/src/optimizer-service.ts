import type { OptimizerStore, PromptOptimization } from "./optimizer-store.ts";

type LearningRecommendation = {
  type: string;
  priority: "high" | "low" | "medium";
  message: string;
};

type ExecutionPerformanceMetric = {
  execution_id: string;
  theme: string;
  brand: string;
  format: string;
  views: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  save_rate: number;
  share_rate: number;
};

type ThemePerformanceMetric = {
  name: string;
  count: number;
  views: number;
  shares: number;
  saves: number;
  followers_gained: number;
  engagement_rate: number;
  save_rate: number;
  share_rate: number;
};

export type OptimizerLearningReport = {
  recommendations?: LearningRecommendation[];
  real_performance?: {
    performance_by_theme?: ThemePerformanceMetric[];
    best_execution?: ExecutionPerformanceMetric | null;
    worst_executions?: ExecutionPerformanceMetric[];
  };
};

export class OptimizerService {
  private readonly store: OptimizerStore;

  constructor(store: OptimizerStore) {
    this.store = store;
  }

  async listOptimizations(): Promise<PromptOptimization[]> {
    return this.store.list();
  }

  async listActiveOptimizations(brandId?: string): Promise<PromptOptimization[]> {
    const optimizations = await this.store.list();

    return optimizations.filter(
      (optimization) => optimization.active && (!brandId || optimization.brand_id === brandId || optimization.brand_id === "global")
    );
  }

  async generateOptimizations(report: OptimizerLearningReport): Promise<PromptOptimization[]> {
    const generated = buildOptimizations(report);
    const existing = await this.store.list();
    const existingManual = existing.filter((optimization) => optimization.source !== "feedback_analytics");
    const merged = dedupeOptimizations([...existingManual, ...generated]);

    await this.store.saveAll(merged);

    return merged;
  }
}

function buildOptimizations(report: OptimizerLearningReport): PromptOptimization[] {
  const now = new Date().toISOString();
  const optimizations: PromptOptimization[] = [];
  const bestTheme = report.real_performance?.performance_by_theme?.[0];
  const bestExecution = report.real_performance?.best_execution ?? null;
  const weakExecution = report.real_performance?.worst_executions?.[0];
  const fallbackBrand = bestExecution?.brand ?? "global";

  if (bestTheme && bestTheme.engagement_rate > 0) {
    optimizations.push(createOptimization({
      agent: "hook_specialist",
      brand_id: fallbackBrand,
      created_at: now,
      instruction: `Priorize hooks conectados ao tema ${bestTheme.name}, pois ele lidera a performance real com ${bestTheme.engagement_rate}% de engajamento.`
    }));
  }

  if (bestTheme && bestTheme.share_rate > 0) {
    optimizations.push(createOptimization({
      agent: "hook_specialist",
      brand_id: fallbackBrand,
      created_at: now,
      instruction: `Inclua aberturas com pergunta ou contraste emocional em temas como ${bestTheme.name}, pois esse grupo teve ${bestTheme.share_rate}% de taxa de compartilhamento.`
    }));
  }

  if (bestTheme && bestTheme.save_rate > 0) {
    optimizations.push(createOptimization({
      agent: "story_writer",
      brand_id: fallbackBrand,
      created_at: now,
      instruction: `Fortaleca reflexoes finais em conteudos sobre ${bestTheme.name}, pois esse tema teve ${bestTheme.save_rate}% de taxa de salvamento.`
    }));
  }

  if (bestExecution) {
    optimizations.push(createOptimization({
      agent: "creative_director",
      brand_id: bestExecution.brand,
      created_at: now,
      instruction: `Use a execucao ${bestExecution.execution_id} como referencia de direcao criativa para ${bestExecution.theme}: ela teve ${bestExecution.views} views e ${bestExecution.engagement_rate}% de engajamento.`
    }));
  }

  if (weakExecution) {
    optimizations.push(createOptimization({
      agent: "reviewer",
      brand_id: weakExecution.brand,
      created_at: now,
      instruction: `Reprove roteiros parecidos com a execucao ${weakExecution.execution_id} quando tiverem baixa tensao emocional, pois ela ficou entre as piores performances reais.`
    }));
  }

  for (const recommendation of report.recommendations ?? []) {
    if (recommendation.priority !== "high") continue;

    optimizations.push(createOptimization({
      agent: recommendation.type === "fallback" ? "reviewer" : "brand_guardian",
      brand_id: fallbackBrand,
      created_at: now,
      instruction: recommendation.message,
      source: "learning_engine"
    }));
  }

  return dedupeOptimizations(optimizations);
}

function createOptimization(input: {
  agent: string;
  brand_id: string;
  created_at: string;
  instruction: string;
  source?: PromptOptimization["source"];
}): PromptOptimization {
  return {
    id: slugify(`${input.brand_id}-${input.agent}-${input.source ?? "feedback_analytics"}-${input.instruction}`),
    brand_id: input.brand_id,
    agent: input.agent,
    instruction: input.instruction,
    source: input.source ?? "feedback_analytics",
    active: true,
    created_at: input.created_at
  };
}

function dedupeOptimizations(optimizations: PromptOptimization[]): PromptOptimization[] {
  const byId = new Map<string, PromptOptimization>();

  for (const optimization of optimizations) {
    byId.set(optimization.id, optimization);
  }

  return Array.from(byId.values()).sort((a, b) => b.created_at.localeCompare(a.created_at) || a.agent.localeCompare(b.agent));
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
