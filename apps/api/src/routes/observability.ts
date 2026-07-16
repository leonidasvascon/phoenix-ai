import { getMetricsSnapshot, getObservabilityStatus } from "@phoenix-ai/observability";
import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";

export async function handleObservabilityRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (request.method === "GET" && url.pathname === "/observability/status") {
    sendJson(response, 200, getObservabilityStatus());
    return;
  }

  if (request.method === "GET" && url.pathname === "/metrics") {
    sendJson(response, 200, {
      format: "json",
      ...getMetricsSnapshot()
    });
    return;
  }

  sendJson(response, 405, {
    status: "error",
    message: "Method not allowed."
  });
}
