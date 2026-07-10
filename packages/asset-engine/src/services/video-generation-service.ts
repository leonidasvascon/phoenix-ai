import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { GeneratedVideo, PersistedVideoJob, VideoGenerationOptions, VideoJob } from "../types/assets.ts";
import { MockVideoJobProvider } from "../providers/video/mock-video-provider.ts";
import type { VideoJobProvider } from "../providers/video/video-job-provider.ts";
import { pollVideoJob } from "./video-job-poller.ts";

export class VideoGenerationService {
  private readonly provider: VideoJobProvider;
  private readonly fallbackProvider: MockVideoJobProvider;

  constructor(provider: VideoJobProvider, fallbackProvider = new MockVideoJobProvider()) {
    this.provider = provider;
    this.fallbackProvider = fallbackProvider;
  }

  async generate(prompt: string, destination: string, options: VideoGenerationOptions = {}): Promise<GeneratedVideo> {
    const executionId = options.executionId ?? "unknown";
    let job = await this.provider.createJob(prompt, options);

    await this.persistJob(executionId, job);

    if (!job.fallback && job.status !== "completed") {
      job = await pollVideoJob(this.provider, job, {
        intervalMs: options.pollIntervalMs,
        timeoutMs: options.timeoutMs
      });
      await this.persistJob(executionId, job);
    }

    if (job.status === "completed") {
      try {
        const video = await this.provider.downloadResult(job, destination);
        await this.persistJob(executionId, job, video);
        return video;
      } catch (error) {
        job = {
          ...job,
          status: "failed",
          completed_at: new Date().toISOString(),
          failure_reason: error instanceof Error ? error.message : "Unknown video download error."
        };
      }
    }

    const fallbackVideo = await this.generateFallback(prompt, destination, options, job.failure_reason ?? `Video job ${job.status}.`);
    await this.persistJob(executionId, {
      id: fallbackVideo.provider_job_id ?? nullFallbackJobId(),
      provider_id: fallbackVideo.provider_id,
      requested_provider: fallbackVideo.requested_provider ?? options.requestedProvider ?? this.provider.id,
      status: fallbackVideo.status ?? "completed",
      prompt,
      model: fallbackVideo.model ?? null,
      size: fallbackVideo.size ?? options.size ?? "1080x1920",
      duration_seconds: fallbackVideo.duration_seconds ?? options.durationSeconds ?? 8,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      failure_reason: job.failure_reason,
      fallback: true
    }, fallbackVideo);

    return fallbackVideo;
  }

  private async generateFallback(
    prompt: string,
    destination: string,
    options: VideoGenerationOptions,
    reason: string
  ): Promise<GeneratedVideo> {
    const fallbackJob = await this.fallbackProvider.createJob(prompt, {
      ...options,
      requestedProvider: options.requestedProvider ?? this.provider.id,
      model: null
    });
    const fallbackVideo = await this.fallbackProvider.downloadResult(
      {
        ...fallbackJob,
        failure_reason: reason,
        fallback: true
      },
      destination
    );

    return {
      ...fallbackVideo,
      failure_reason: reason,
      fallback: true
    };
  }

  private async persistJob(executionId: string, job: VideoJob, video?: GeneratedVideo): Promise<void> {
    const path = videoJobPath(executionId);
    const existing = await readPersistedJob(path);

    if (existing?.status === "completed" && existing.fallback === false && video?.fallback) {
      return;
    }

    const payload: PersistedVideoJob = {
      execution_id: executionId,
      requested_provider: video?.requested_provider ?? job.requested_provider,
      provider_id: video?.provider_id ?? job.provider_id,
      provider_job_id: video?.provider_job_id ?? job.id ?? null,
      status: video?.status ?? job.status,
      fallback: video?.fallback ?? Boolean(job.fallback),
      model: video?.model ?? job.model,
      size: video?.size ?? job.size,
      duration_seconds: video?.duration_seconds ?? job.duration_seconds,
      failure_reason: video?.failure_reason ?? job.failure_reason,
      created_at: existing?.created_at ?? job.created_at,
      completed_at: video?.status === "completed" || job.status === "completed" ? new Date().toISOString() : job.completed_at
    };

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }
}

export async function readVideoJobs(storageRoot = ".storage"): Promise<PersistedVideoJob[]> {
  const { readdir } = await import("node:fs/promises");
  const directory = resolve(process.cwd(), storageRoot, "video-jobs");

  try {
    const files = await readdir(directory);
    const jobs = await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => JSON.parse(await readFile(resolve(directory, file), "utf8")) as PersistedVideoJob)
    );

    return jobs.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    return [];
  }
}

export async function readVideoJob(executionId: string): Promise<PersistedVideoJob | null> {
  try {
    return JSON.parse(await readFile(videoJobPath(executionId), "utf8")) as PersistedVideoJob;
  } catch {
    return null;
  }
}

function videoJobPath(executionId: string): string {
  return resolve(process.cwd(), ".storage", "video-jobs", `${executionId}.json`);
}

async function readPersistedJob(path: string): Promise<PersistedVideoJob | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as PersistedVideoJob;
  } catch {
    return null;
  }
}

function nullFallbackJobId(): string {
  return `mock-video-${Date.now()}`;
}
