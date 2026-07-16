import { Evaluator } from "./evaluator.ts";
import type { EvaluationInput, EvaluationResult } from "./scorer.ts";

export type RegressionExecution = {
  execution_id?: string;
  output?: Record<string, unknown>;
  execution?: {
    task?: Record<string, unknown>;
  };
};

export type RegressionResult = {
  execution_id: string;
  evaluation: EvaluationResult;
  passed: boolean;
};

export function runRegression(executions: RegressionExecution[], limit = 100): RegressionResult[] {
  const evaluator = new Evaluator();

  return executions
    .filter((execution) => execution.output)
    .slice(0, limit)
    .map((execution, index) => {
      const evaluation = evaluator.evaluate({
        output: execution.output ?? {},
        task: execution.execution?.task
      } satisfies EvaluationInput);

      return {
        execution_id: execution.execution_id ?? `execution-${index + 1}`,
        evaluation,
        passed: evaluation.passed
      };
    });
}
