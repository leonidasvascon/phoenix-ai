export type ScoreResult = {
  score: number;
  reason: string;
};

function hasAny(output: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => key in output && output[key] != null && output[key] !== "");
}

export function scoreAgentOutput(agentId: string, output: Record<string, unknown>): ScoreResult {
  if (typeof output.score === "number") {
    return {
      score: output.score,
      reason: "Agent provided explicit score."
    };
  }

  const checks: Array<{ passed: boolean; weight: number; reason: string }> = [
    {
      passed: Object.keys(output).length > 0,
      weight: 40,
      reason: "non-empty JSON"
    },
    {
      passed: hasAny(output, [agentId, "research", "hook", "story", "caption", "review"]),
      weight: 35,
      reason: "expected content fields"
    },
    {
      passed: JSON.stringify(output).length >= 20,
      weight: 25,
      reason: "usable content length"
    }
  ];

  const score = checks.reduce((total, check) => total + (check.passed ? check.weight : 0), 0);
  const failed = checks.filter((check) => !check.passed).map((check) => check.reason);

  return {
    score,
    reason: failed.length > 0 ? `Failed checks: ${failed.join(", ")}.` : "All heuristic checks passed."
  };
}

