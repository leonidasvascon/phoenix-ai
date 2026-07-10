import type { GeneratedVideo, VideoGenerationOptions, VideoJob } from "../../types/assets.ts";

export interface VideoJobProvider {
  id: string;
  createJob(prompt: string, options?: VideoGenerationOptions): Promise<VideoJob>;
  getJob(jobId: string): Promise<VideoJob>;
  downloadResult(job: VideoJob, destination: string): Promise<GeneratedVideo>;
}
