import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getVideoJob, listVideoJobs } from "../services/video-job-service.ts";

export async function handleVideoJobsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (request.method === "GET" && url.pathname === "/video-jobs") {
    sendJson(response, 200, await listVideoJobs());
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/video-jobs/")) {
    const executionId = decodeURIComponent(url.pathname.replace("/video-jobs/", ""));
    const job = await getVideoJob(executionId);

    if (!job) {
      sendJson(response, 404, {
        status: "error",
        message: "Video job not found."
      });
      return;
    }

    sendJson(response, 200, job);
    return;
  }

  sendJson(response, 404, {
    status: "error",
    message: "Video jobs route not found."
  });
}
