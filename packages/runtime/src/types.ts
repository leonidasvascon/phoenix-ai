export type Task = {
  brand: string;
  objective: string;
  platform: string;
  format: string;
  theme: string;
  language?: string;
};

export type Brand = {
  version: string | number;
  brand: {
    id: string;
    name: string;
  };
  purpose?: string;
  personality?: Record<string, unknown>;
  tone?: Record<string, unknown>;
  writing?: Record<string, unknown>;
  visual?: Record<string, unknown>;
  content?: Record<string, unknown>;
  emotions?: string[];
  avoid?: string[];
  success_metrics?: Record<string, unknown>;
  preferred_hooks?: string[];
  preferred_storytelling?: string[];
  preferred_cta?: string;
  preferred_emotions?: string[];
  forbidden_patterns?: string[];
  [key: string]: unknown;
};

export type KnowledgeDocument = {
  category: string;
  id: string;
  title?: string;
  objective?: string;
  usage?: string;
  examples?: string[];
  avoid?: string[];
  keywords?: string[];
  notes?: string;
  [key: string]: unknown;
};

export type KnowledgeContext = {
  documents: KnowledgeDocument[];
  by_category: Record<string, KnowledgeDocument[]>;
};

export type RecentOutput = {
  execution_id: string;
  theme: string;
  format: string;
  hook?: string;
  cta?: string;
  score?: number;
  created_at: string;
};

export type BrandMemory = {
  brand_id: string;
  used_hooks: string[];
  used_themes: string[];
  used_ctas: string[];
  used_storytelling: string[];
  recent_outputs: RecentOutput[];
};

export type LearningRecommendation = {
  type: string;
  priority: "high" | "low" | "medium";
  message: string;
};

export type PromptOptimization = {
  id: string;
  brand_id: string;
  agent: string;
  instruction: string;
  source: string;
  active: boolean;
  created_at: string;
};

export type PipelineStep = {
  id: string;
  type: "system" | "agent";
  agent?: string;
  description?: string;
};

export type Pipeline = {
  name: string;
  version: string | number;
  steps: PipelineStep[];
  outputFields: string[];
};

export type ExecutionLog = {
  step: string;
  status: "success" | "error";
  message: string;
  timestamp: string;
};

export type ExecutionContext = {
  executionId: string;
  trace_id?: string;
  startedAt: number;
  task: Task;
  brand?: Brand;
  pipeline?: Pipeline;
  knowledge?: KnowledgeContext;
  knowledge_graph?: Record<string, unknown>;
  memory?: BrandMemory;
  learning_recommendations: LearningRecommendation[];
  prompt_optimizations: PromptOptimization[];
  logs: ExecutionLog[];
  outputs: Record<string, unknown>;
  quality: QualitySummary;
  execution: ExecutionReport;
};

export type AgentInput = {
  task: Task;
  brand: Brand;
  context: ExecutionContext;
};

export type AgentOutput = Record<string, unknown>;

export type Agent = {
  id: string;
  execute(input: AgentInput): Promise<AgentOutput>;
};

export type RuntimeResponse = {
  status: "success" | "error";
  execution_id: string;
  execution_time: number;
  pipeline: string[];
  score: number;
  quality: QualitySummary;
  execution: ExecutionReport;
  output: Record<string, unknown>;
  logs: ExecutionLog[];
};

export type RuntimeOptions = {
  provider?: "mock" | "openai" | string;
  quality?: {
    minScore?: number;
    maxAttempts?: number;
  };
  learningRecommendations?: LearningRecommendation[];
  promptOptimizations?: PromptOptimization[];
};

export type FailedAgent = {
  agent: string;
  reason: string;
};

export type QualitySummary = {
  passed: boolean;
  attempts: number;
  failed_agents: FailedAgent[];
  final_score: number;
  dimensions?: QualityDimensions;
  publishable?: boolean;
  rejection_reasons?: string[];
};

export type QualityDimensions = {
  structureScore: number;
  brandAlignmentScore: number;
  toneScore: number;
  originalityScore: number;
  safetyScore: number;
  publishReadinessScore: number;
};

export type TokenUsage = {
  input: number;
  output: number;
  total: number;
};

export type CostUsage = {
  currency: "USD";
  estimated: number;
};

export type ExecutionAgentReport = {
  name: string;
  status: "success" | "error";
  provider: string;
  attempts: number;
  duration_ms: number;
  score: number;
  tokens: TokenUsage;
  cost: CostUsage;
  error?: string;
};

export type ExecutionReport = {
  id: string;
  trace_id?: string;
  provider: string;
  duration_ms: number;
  agents: ExecutionAgentReport[];
  tokens: TokenUsage;
  cost: CostUsage;
  persisted: boolean;
  storage?: string;
  task?: Task;
};
