import type { IncomingMessage, ServerResponse } from "node:http";
import { getVersionInfo } from "@phoenix-ai/version";
import { sendJson } from "../http.ts";

export async function handleVersionRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "GET") {
    sendJson(response, 405, { status: "error", message: "Method not allowed." });
    return;
  }

  sendJson(response, 200, getVersionInfo());
}
