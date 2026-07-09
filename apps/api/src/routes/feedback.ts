import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getFeedback, listFeedback, saveFeedback } from "../services/feedback-service.ts";

export async function handleFeedbackRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, , executionId] = url.pathname.split("/");

  if (request.method === "GET" && !executionId) {
    sendJson(response, 200, await listFeedback());
    return;
  }

  if (request.method === "GET" && executionId) {
    const feedback = await getFeedback(executionId);

    if (!feedback) {
      sendJson(response, 404, {
        status: "error",
        message: "Feedback not found."
      });
      return;
    }

    sendJson(response, 200, feedback);
    return;
  }

  if (request.method === "POST" && !executionId) {
    try {
      const payload = await readJsonBody(request);
      sendJson(response, 201, await saveFeedback(payload));
    } catch (error) {
      sendJson(response, 400, {
        status: "error",
        message: error instanceof Error ? error.message : "Invalid feedback."
      });
    }
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
