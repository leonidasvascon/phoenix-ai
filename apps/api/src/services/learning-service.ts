import { createLearningReport } from "@phoenix-ai/learning-engine";
import { readExecutionFiles } from "@phoenix-ai/runtime";

export async function getLearningReport() {
  const executions = await readExecutionFiles();

  return createLearningReport(executions);
}
