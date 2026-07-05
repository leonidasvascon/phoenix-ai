import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getAnalytics } from "../services/runtime-service.ts";

export async function handleAnalyticsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "GET") {
    sendJson(response, 405, {
      status: "error",
      message: "Method not allowed."
    });
    return;
  }

  sendJson(response, 200, await getAnalytics());
}
