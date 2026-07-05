import { aggregateMetrics, readExecutionFiles } from "../packages/runtime/src/index.ts";

const executions = await readExecutionFiles();
const report = aggregateMetrics(executions);

console.log(JSON.stringify(report, null, 2));

