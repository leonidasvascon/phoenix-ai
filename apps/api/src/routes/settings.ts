import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getRuntimeSettings, updateRuntimeSettings } from "../services/settings-service.ts";

export async function handleSettingsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method === "GET") {
    sendJson(response, 200, await getRuntimeSettings());
    return;
  }

  if (request.method === "PUT") {
    try {
      const payload = await readJsonBody(request);
      sendJson(response, 200, await updateRuntimeSettings(payload as Record<string, unknown>));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid settings payload.";
      sendJson(response, 400, {
        status: "error",
        message
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

  return body.trim() ? JSON.parse(body) : {};
}
