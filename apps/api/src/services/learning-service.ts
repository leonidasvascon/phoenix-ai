import { createLearningReport } from "@phoenix-ai/learning-engine";
import { readExecutionFiles } from "@phoenix-ai/runtime";
import { listFeedback } from "./feedback-service.ts";

export async function getLearningReport() {
  const [executions, feedbacks] = await Promise.all([readExecutionFiles(), listFeedback()]);

  return createLearningReport(executions, feedbacks);
}
