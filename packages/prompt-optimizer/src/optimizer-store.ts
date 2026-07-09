export type PromptOptimization = {
  id: string;
  brand_id: string;
  agent: string;
  instruction: string;
  source: "feedback_analytics" | "learning_engine";
  active: boolean;
  created_at: string;
};

export type OptimizationInput = Omit<PromptOptimization, "created_at" | "id"> & {
  id?: string;
};

export interface OptimizerStore {
  list(): Promise<PromptOptimization[]>;
  saveAll(optimizations: PromptOptimization[]): Promise<void>;
}
