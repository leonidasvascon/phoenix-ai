import type { CostUsage, TokenUsage } from "../types.ts";

const openAiRatesPerOneMillionTokens: Record<string, { input: number; output: number }> = {
  "gpt-4.1-mini": {
    input: 0.4,
    output: 1.6
  }
};

export function emptyCostUsage(): CostUsage {
  return {
    currency: "USD",
    estimated: 0
  };
}

export function estimateCost(provider: string, model: string | undefined, tokens: TokenUsage): CostUsage {
  if (provider !== "openai" || !model) {
    return emptyCostUsage();
  }

  const rates = openAiRatesPerOneMillionTokens[model];
  if (!rates) {
    return emptyCostUsage();
  }

  const estimated = (tokens.input / 1_000_000) * rates.input + (tokens.output / 1_000_000) * rates.output;

  return {
    currency: "USD",
    estimated: Number(estimated.toFixed(6))
  };
}

export function addCostUsage(target: CostUsage, cost?: Partial<CostUsage>): void {
  target.estimated = Number((target.estimated + (cost?.estimated ?? 0)).toFixed(6));
}

