import { FileOptimizerStore, OptimizerService } from "@phoenix-ai/prompt-optimizer";
import { getLearningReport } from "./learning-service.ts";

const optimizerService = new OptimizerService(new FileOptimizerStore());

export async function listPromptOptimizations() {
  return optimizerService.listOptimizations();
}

export async function listActivePromptOptimizations(brandId?: string) {
  return optimizerService.listActiveOptimizations(brandId);
}

export async function generatePromptOptimizations() {
  const learningReport = await getLearningReport();

  return optimizerService.generateOptimizations(learningReport);
}
