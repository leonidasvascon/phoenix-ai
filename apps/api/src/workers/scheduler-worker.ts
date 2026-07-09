import { runDueScheduledJobs } from "../services/scheduled-job-service.ts";

type SchedulerWorkerHandle = {
  stop: () => void;
};

const defaultIntervalMs = 60_000;

export function startSchedulerWorker(): SchedulerWorkerHandle | null {
  if (process.env.PHOENIX_SCHEDULER_WORKER !== "true") {
    console.log("[scheduler-worker] disabled");
    return null;
  }

  const intervalMs = readIntervalMs();
  let running = false;

  console.log(`[scheduler-worker] enabled interval_ms=${intervalMs}`);

  async function tick() {
    if (running) {
      console.log("[scheduler-worker] skipped tick because previous run is still active");
      return;
    }

    running = true;

    try {
      const result = await runDueScheduledJobs();
      console.log(`[scheduler-worker] jobs_checked=${result.checked} jobs_executed=${result.executed}`);

      for (const job of result.jobs) {
        console.log(`[scheduler-worker] job_id=${job.id} status=${job.status} name="${job.name}"`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scheduler worker error.";
      console.error(`[scheduler-worker] error=${message}`);
    } finally {
      running = false;
    }
  }

  void tick();
  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  return {
    stop: () => clearInterval(timer)
  };
}

function readIntervalMs(): number {
  const value = Number(process.env.PHOENIX_SCHEDULER_INTERVAL_MS ?? defaultIntervalMs);

  if (!Number.isFinite(value) || value <= 0) {
    return defaultIntervalMs;
  }

  return value;
}
