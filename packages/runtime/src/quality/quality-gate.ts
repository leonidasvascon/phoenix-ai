import { parseJsonOutput } from "./json-parser.ts";
import { validateAgentOutput } from "./schema-validator.ts";
import { scoreAgentOutput } from "./quality-scorer.ts";

export type QualityGateResult = {
  passed: boolean;
  score: number;
  output?: Record<string, unknown>;
  reason?: string;
};

export function runQualityGate(agentId: string, rawOutput: unknown, minScore: number): QualityGateResult {
  let output: Record<string, unknown>;

  try {
    output = parseJsonOutput(rawOutput);
  } catch (error) {
    return {
      passed: false,
      score: 0,
      reason: error instanceof Error ? error.message : "Invalid JSON output."
    };
  }

  const validation = validateAgentOutput(output);
  if (!validation.valid) {
    return {
      passed: false,
      score: 0,
      reason: validation.reason
    };
  }

  const score = scoreAgentOutput(agentId, output);

  return {
    passed: score.score >= minScore,
    score: score.score,
    output,
    reason: score.reason
  };
}

