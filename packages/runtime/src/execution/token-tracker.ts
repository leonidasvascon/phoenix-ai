import type { TokenUsage } from "../types.ts";

export function emptyTokenUsage(): TokenUsage {
  return {
    input: 0,
    output: 0,
    total: 0
  };
}

export function addTokenUsage(target: TokenUsage, usage?: Partial<TokenUsage>): void {
  target.input += usage?.input ?? 0;
  target.output += usage?.output ?? 0;
  target.total += usage?.total ?? (usage?.input ?? 0) + (usage?.output ?? 0);
}

