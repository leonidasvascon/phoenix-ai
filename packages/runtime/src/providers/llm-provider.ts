export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmRequest = {
  agentId: string;
  messages: LlmMessage[];
  temperature?: number;
};

export type LlmProvider = {
  id: string;
  generateJson(request: LlmRequest): Promise<Record<string, unknown>>;
};

