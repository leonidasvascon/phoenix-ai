import { runRegression } from "../packages/evaluation-engine/src/index.ts";
import { readExecutionFiles } from "../packages/runtime/src/index.ts";

const maximumFailures = Number(process.env.PHOENIX_MAX_REGRESSION_FAILURES ?? 0);
const executions = await readExecutionFiles();
const results = runRegression(executions);
const passed = results.filter((item) => item.passed).length;
const failed = results.length - passed;

console.log(JSON.stringify({
  passed,
  failed,
  total: results.length,
  results: results.map((item) => ({
    execution_id: item.execution_id,
    score: item.evaluation.overall_score,
    passed: item.passed
  }))
}, null, 2));

if (failed > maximumFailures) {
  console.error(`Regression failures ${failed} exceed ${maximumFailures}.`);
  process.exit(1);
}
