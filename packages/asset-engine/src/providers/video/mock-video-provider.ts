import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { GeneratedVideo, VideoGenerationOptions, VideoJob } from "../../types/assets.ts";
import type { VideoJobProvider } from "./video-job-provider.ts";

export class MockVideoJobProvider implements VideoJobProvider {
  readonly id = "mock";
  private readonly jobs = new Map<string, VideoJob>();

  async createJob(prompt: string, options: VideoGenerationOptions = {}): Promise<VideoJob> {
    const now = new Date().toISOString();
    const job: VideoJob = {
      id: `mock-video-${Date.now()}`,
      provider_id: this.id,
      requested_provider: options.requestedProvider ?? this.id,
      status: "completed",
      prompt,
      model: options.model ?? null,
      size: options.size ?? "1080x1920",
      duration_seconds: options.durationSeconds ?? 8,
      created_at: now,
      completed_at: now,
      fallback: options.requestedProvider !== undefined && options.requestedProvider !== this.id
    };

    this.jobs.set(job.id, job);

    return job;
  }

  async getJob(jobId: string): Promise<VideoJob> {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error(`Mock video job not found: ${jobId}`);
    }

    return job;
  }

  async downloadResult(job: VideoJob, destination: string): Promise<GeneratedVideo> {
    const outputPath = resolve(destination);
    const placeholder = [
      "PHOENIX_AI_PLACEHOLDER_VIDEO",
      `provider=${this.id}`,
      `requested_provider=${job.requested_provider}`,
      `job=${job.id}`,
      `status=${job.status}`,
      `prompt=${job.prompt}`,
      `duration=${job.duration_seconds}`,
      `size=${job.size}`
    ].join("\n");

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, placeholder, "utf8");

    return {
      provider_id: this.id,
      requested_provider: job.requested_provider,
      provider_job_id: job.id,
      status: job.status,
      path: outputPath,
      mime_type: "video/mp4",
      prompt: job.prompt,
      placeholder: true,
      fallback: Boolean(job.fallback),
      model: job.model,
      size: job.size,
      duration_seconds: job.duration_seconds
    };
  }
}
