import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { createScheduledJob, deleteScheduledJob, listScheduledJobs, runDueScheduledJobs } from "../services/scheduled-job-service.ts";

export async function handleScheduledJobsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, , jobId] = url.pathname.split("/");

  if (request.method === "GET" && !jobId) {
    sendJson(response, 200, await listScheduledJobs());
    return;
  }

  if (request.method === "POST" && jobId === "run-due") {
    sendJson(response, 200, await runDueScheduledJobs());
    return;
  }

  if (request.method === "POST" && !jobId) {
    try {
      const payload = await readJsonBody(request);
      sendJson(response, 201, await createScheduledJob(payload));
    } catch (error) {
      sendJson(response, 400, {
        status: "error",
        message: error instanceof Error ? error.message : "Invalid scheduled job."
      });
    }
    return;
  }

  if (request.method === "DELETE" && jobId) {
    const deleted = await deleteScheduledJob(jobId);

    if (!deleted) {
      sendJson(response, 404, {
        status: "error",
        message: "Scheduled job not found."
      });
      return;
    }

    sendJson(response, 200, {
      status: "deleted",
      id: jobId
    });
    return;
  }

  sendJson(response, 405, {
    status: "error",
    message: "Method not allowed."
  });
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");

  if (!body.trim()) {
    throw new Error("Request body is required.");
  }

  return JSON.parse(body) as unknown;
}
