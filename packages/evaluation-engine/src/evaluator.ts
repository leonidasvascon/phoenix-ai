import { defaultRubric, type EvaluationRubric } from "./rubric.ts";
import { scoreEvaluation, type EvaluationInput, type EvaluationResult } from "./scorer.ts";

export class Evaluator {
  private readonly rubric: EvaluationRubric;
  private readonly threshold: number;

  constructor(
    rubric: EvaluationRubric = defaultRubric,
    threshold = 90
  ) {
    this.rubric = rubric;
    this.threshold = threshold;
  }

  evaluate(input: EvaluationInput): EvaluationResult {
    return scoreEvaluation(input, this.rubric, this.threshold);
  }
}
