import { readVideoJob, readVideoJobs } from "@phoenix-ai/asset-engine";

export function listVideoJobs() {
  return readVideoJobs();
}

export function getVideoJob(executionId: string) {
  return readVideoJob(executionId);
}
