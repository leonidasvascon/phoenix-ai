export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmRequest = {
  agentId: string;
  messages: LlmMessage[];
  temperature?: number;
};

export type LlmUsage = {
  input: number;
  output: number;
  total: number;
};

export type LlmCost = {
  currency: "USD";
  estimated: number;
};

export type LlmProviderResponse = {
  output: Record<string, unknown>;
  model?: string;
  usage: LlmUsage;
  cost: LlmCost;
};

export type LlmProvider = {
  id: string;
  generateJson(request: LlmRequest): Promise<LlmProviderResponse>;
};
