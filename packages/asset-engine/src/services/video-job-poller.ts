import type { VideoJob } from "../types/assets.ts";
import type { VideoJobProvider } from "../providers/video/video-job-provider.ts";

export type VideoJobPollingOptions = {
  intervalMs?: number;
  timeoutMs?: number;
};

const terminalStatuses = new Set<VideoJob["status"]>(["cancelled", "completed", "failed"]);

export async function pollVideoJob(
  provider: VideoJobProvider,
  initialJob: VideoJob,
  options: VideoJobPollingOptions = {}
): Promise<VideoJob> {
  const intervalMs = options.intervalMs ?? Number(process.env.PHOENIX_VIDEO_POLL_INTERVAL_MS ?? 5000);
  const timeoutMs = options.timeoutMs ?? Number(process.env.PHOENIX_VIDEO_TIMEOUT_MS ?? 600000);
  const startedAt = Date.now();
  let current = initialJob;

  while (!terminalStatuses.has(current.status)) {
    if (Date.now() - startedAt >= timeoutMs) {
      return {
        ...current,
        status: "failed",
        completed_at: new Date().toISOString(),
        failure_reason: `Video job timed out after ${timeoutMs}ms.`
      };
    }

    await sleep(intervalMs);
    current = await provider.getJob(current.id);
  }

  return current;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.max(ms, 0));
  });
}
