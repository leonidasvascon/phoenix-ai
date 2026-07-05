import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { executeTask } from "../services/runtime-service.ts";

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const source = Buffer.concat(chunks).toString("utf8");

  return source ? JSON.parse(source) : {};
}

export async function handleTasksRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "POST") {
    sendJson(response, 405, {
      status: "error",
      message: "Method not allowed."
    });
    return;
  }

  try {
    const body = await readJson(request);
    const result = await executeTask(body as Record<string, unknown>);
    sendJson(response, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid task.";
    sendJson(response, 400, {
      status: "error",
      message
    });
  }
}
