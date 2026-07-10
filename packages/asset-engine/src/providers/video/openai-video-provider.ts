import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { GeneratedVideo, VideoGenerationOptions, VideoJob } from "../../types/assets.ts";
import { MockVideoJobProvider } from "./mock-video-provider.ts";
import type { VideoJobProvider } from "./video-job-provider.ts";

type OpenAIVideoJobResponse = {
  id?: string;
  status?: string;
  url?: string;
  result_url?: string;
  error?: {
    message?: string;
  };
};

const supportedStatuses = new Set(["cancelled", "completed", "failed", "processing", "queued"]);

export class OpenAIVideoProvider implements VideoJobProvider {
  readonly id = "openai";
  private readonly apiKey: string;
  private readonly fallback: MockVideoJobProvider;

  constructor(options: { apiKey?: string; fallback?: MockVideoJobProvider } = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.fallback = options.fallback ?? new MockVideoJobProvider();
  }

  async createJob(prompt: string, options: VideoGenerationOptions = {}): Promise<VideoJob> {
    const config = this.readConfig(options);
    const validation = this.validateConfig(config);

    if (validation) {
      return this.createFallbackJob(prompt, config, validation);
    }

    try {
      const response = await fetch("https://api.openai.com/v1/videos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.model,
          prompt,
          size: config.size,
          duration_seconds: config.durationSeconds
        })
      });
      const payload = (await response.json()) as OpenAIVideoJobResponse;

      if (!response.ok) {
        throw new Error(payload.error?.message ?? `OpenAI video job failed with ${response.status}.`);
      }

      if (!payload.id) {
        throw new Error("OpenAI video response did not include a job id.");
      }

      return {
        id: payload.id,
        provider_id: this.id,
        requested_provider: config.requestedProvider,
        status: normalizeStatus(payload.status),
        prompt,
        model: config.model,
        size: config.size,
        duration_seconds: config.durationSeconds,
        created_at: new Date().toISOString(),
        result_url: payload.result_url ?? payload.url
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown OpenAI video create error.";
      return this.createFallbackJob(prompt, config, reason);
    }
  }

  async getJob(jobId: string): Promise<VideoJob> {
    if (jobId.startsWith("mock-video-")) {
      return this.fallback.getJob(jobId);
    }

    try {
      const response = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        }
      });
      const payload = (await response.json()) as OpenAIVideoJobResponse;

      if (!response.ok) {
        throw new Error(payload.error?.message ?? `OpenAI video status failed with ${response.status}.`);
      }

      return {
        id: jobId,
        provider_id: this.id,
        requested_provider: this.id,
        status: normalizeStatus(payload.status),
        prompt: "",
        model: process.env.PHOENIX_VIDEO_MODEL ?? null,
        size: process.env.PHOENIX_VIDEO_SIZE ?? "1080x1920",
        duration_seconds: Number(process.env.PHOENIX_VIDEO_DURATION_SECONDS ?? 8),
        created_at: new Date().toISOString(),
        result_url: payload.result_url ?? payload.url
      };
    } catch (error) {
      return {
        id: jobId,
        provider_id: this.id,
        requested_provider: this.id,
        status: "failed",
        prompt: "",
        model: process.env.PHOENIX_VIDEO_MODEL ?? null,
        size: process.env.PHOENIX_VIDEO_SIZE ?? "1080x1920",
        duration_seconds: Number(process.env.PHOENIX_VIDEO_DURATION_SECONDS ?? 8),
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        failure_reason: error instanceof Error ? error.message : "Unknown OpenAI video status error."
      };
    }
  }

  async downloadResult(job: VideoJob, destination: string): Promise<GeneratedVideo> {
    if (job.provider_id === "mock" || job.id.startsWith("mock-video-")) {
      return this.fallback.downloadResult(job, destination);
    }

    if (!job.result_url) {
      throw new Error("Completed OpenAI video job does not include a result URL.");
    }

    const response = await fetch(job.result_url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAI video download failed with ${response.status}.`);
    }

    const outputPath = resolve(destination);
    const video = Buffer.from(await response.arrayBuffer());

    if (video.length === 0) {
      throw new Error("OpenAI video download was empty.");
    }

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, video);

    return {
      provider_id: this.id,
      requested_provider: job.requested_provider,
      provider_job_id: job.id,
      status: job.status,
      path: outputPath,
      mime_type: "video/mp4",
      prompt: job.prompt,
      placeholder: false,
      fallback: false,
      model: job.model,
      size: job.size,
      duration_seconds: job.duration_seconds
    };
  }

  private readConfig(options: VideoGenerationOptions) {
    return {
      requestedProvider: options.requestedProvider ?? this.id,
      model: options.model ?? process.env.PHOENIX_VIDEO_MODEL ?? null,
      size: options.size ?? process.env.PHOENIX_VIDEO_SIZE ?? "1080x1920",
      durationSeconds: options.durationSeconds ?? Number(process.env.PHOENIX_VIDEO_DURATION_SECONDS ?? 8)
    };
  }

  private validateConfig(config: ReturnType<OpenAIVideoProvider["readConfig"]>): string | null {
    if (!this.apiKey) return "OPENAI_API_KEY is required.";
    if (!config.model?.trim()) return "PHOENIX_VIDEO_MODEL is required.";
    if (!config.size?.trim()) return "PHOENIX_VIDEO_SIZE is required.";
    if (!Number.isFinite(config.durationSeconds) || config.durationSeconds <= 0) {
      return "PHOENIX_VIDEO_DURATION_SECONDS must be greater than 0.";
    }

    return null;
  }

  private async createFallbackJob(
    prompt: string,
    config: ReturnType<OpenAIVideoProvider["readConfig"]>,
    reason: string
  ): Promise<VideoJob> {
    const job = await this.fallback.createJob(prompt, {
      requestedProvider: this.id,
      model: null,
      size: config.size,
      durationSeconds: config.durationSeconds
    });

    return {
      ...job,
      failure_reason: reason,
      fallback: true
    };
  }
}

function normalizeStatus(status: string | undefined): VideoJob["status"] {
  return status && supportedStatuses.has(status) ? status as VideoJob["status"] : "processing";
}
