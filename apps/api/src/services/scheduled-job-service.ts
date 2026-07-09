import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { executeBatchTasks, executeTask } from "./runtime-service.ts";

type ScheduledJobType = "batch" | "task";
type ScheduledJobStatus = "pending" | "running" | "completed" | "failed";

export type ScheduledJob = {
  id: string;
  name: string;
  type: ScheduledJobType;
  run_at: string;
  payload: Record<string, unknown>;
  status: ScheduledJobStatus;
  created_at: string;
  updated_at: string;
  executed_at?: string;
  last_error?: string;
  last_result?: unknown;
};

type ScheduledJobInput = {
  name?: unknown;
  type?: unknown;
  run_at?: unknown;
  payload?: unknown;
  status?: unknown;
};

function getScheduledJobsPath(): string {
  return resolve(process.cwd(), ".storage", "scheduled-jobs.json");
}

export async function listScheduledJobs(): Promise<ScheduledJob[]> {
  return readJobs();
}

export async function createScheduledJob(input: unknown): Promise<ScheduledJob> {
  const payload = validateJobInput(input);
  const now = new Date().toISOString();
  const jobs = await readJobs();
  const job: ScheduledJob = {
    id: randomUUID(),
    ...payload,
    status: payload.status ?? "pending",
    created_at: now,
    updated_at: now
  };

  await writeJobs([...jobs, job]);

  return job;
}

export async function deleteScheduledJob(jobId: string): Promise<boolean> {
  validateJobId(jobId);
  const jobs = await readJobs();
  const nextJobs = jobs.filter((job) => job.id !== jobId);

  if (nextJobs.length === jobs.length) {
    return false;
  }

  await writeJobs(nextJobs);

  return true;
}

export async function runDueScheduledJobs(now = new Date()): Promise<{
  executed: number;
  jobs: ScheduledJob[];
}> {
  const jobs = await readJobs();
  const dueJobIndexes = jobs
    .map((job, index) => ({ job, index }))
    .filter(({ job }) => job.status === "pending" && Date.parse(job.run_at) <= now.getTime());
  const executedJobs: ScheduledJob[] = [];

  for (const { job, index } of dueJobIndexes) {
    const startedAt = new Date().toISOString();
    jobs[index] = {
      ...job,
      status: "running",
      updated_at: startedAt
    };
    await writeJobs(jobs);

    try {
      const result = job.type === "batch" ? await executeBatchTasks(job.payload) : await executeTask(job.payload);
      const completedJob: ScheduledJob = {
        ...jobs[index],
        status: "completed",
        executed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_error: undefined,
        last_result: result
      };

      jobs[index] = completedJob;
      executedJobs.push(completedJob);
    } catch (error) {
      const failedJob: ScheduledJob = {
        ...jobs[index],
        status: "failed",
        executed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_error: error instanceof Error ? error.message : "Scheduled job failed."
      };

      jobs[index] = failedJob;
      executedJobs.push(failedJob);
    }

    await writeJobs(jobs);
  }

  return {
    executed: executedJobs.length,
    jobs: executedJobs
  };
}

async function readJobs(): Promise<ScheduledJob[]> {
  try {
    const source = await readFile(getScheduledJobsPath(), "utf8");
    const parsed = JSON.parse(source) as unknown;

    return Array.isArray(parsed) ? parsed.filter(isScheduledJob) : [];
  } catch {
    return [];
  }
}

async function writeJobs(jobs: ScheduledJob[]): Promise<void> {
  const jobsPath = getScheduledJobsPath();

  await mkdir(dirname(jobsPath), { recursive: true });
  await writeFile(jobsPath, `${JSON.stringify(jobs, null, 2)}\n`, "utf8");
}

function validateJobInput(input: unknown): Pick<ScheduledJob, "name" | "payload" | "run_at" | "type"> & { status?: ScheduledJobStatus } {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid scheduled job payload.");
  }

  const payload = input as ScheduledJobInput;
  const type = readRequiredString(payload.type, "Job type is required.");
  const runAt = readRequiredString(payload.run_at, "Run date is required.");

  if (type !== "task" && type !== "batch") {
    throw new Error("Invalid scheduled job type.");
  }

  if (Number.isNaN(Date.parse(runAt))) {
    throw new Error("Invalid run_at date.");
  }

  if (!payload.payload || typeof payload.payload !== "object" || Array.isArray(payload.payload)) {
    throw new Error("Scheduled job payload is required.");
  }

  const status = typeof payload.status === "string" && ["pending", "running", "completed", "failed"].includes(payload.status)
    ? payload.status as ScheduledJobStatus
    : undefined;

  return {
    name: readRequiredString(payload.name, "Job name is required."),
    type,
    run_at: runAt,
    payload: payload.payload as Record<string, unknown>,
    status
  };
}

function validateJobId(jobId: string): void {
  if (!jobId || !/^[a-zA-Z0-9-]+$/.test(jobId)) {
    throw new Error("Invalid scheduled job id.");
  }
}

function readRequiredString(value: unknown, message: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return value.trim();
}

function isScheduledJob(value: unknown): value is ScheduledJob {
  if (!value || typeof value !== "object") {
    return false;
  }

  const job = value as ScheduledJob;

  return Boolean(
    job.id
      && job.name
      && (job.type === "task" || job.type === "batch")
      && job.run_at
      && job.payload
      && job.status
  );
}
