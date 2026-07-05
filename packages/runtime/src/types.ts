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
  [key: string]: unknown;
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
  startedAt: number;
  task: Task;
  brand?: Brand;
  pipeline?: Pipeline;
  logs: ExecutionLog[];
  outputs: Record<string, unknown>;
  quality: QualitySummary;
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
  output: Record<string, unknown>;
  logs: ExecutionLog[];
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
};
