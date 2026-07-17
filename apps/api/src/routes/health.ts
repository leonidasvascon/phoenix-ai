import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getHealthDetails, getLiveness, getReadiness } from "../services/health-service.ts";

export async function handleHealthRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (request.method !== "GET") {
    sendJson(response, 405, {
      status: "error",
      message: "Method not allowed."
    });
    return;
  }

  if (url.pathname === "/health" || url.pathname === "/health/live") {
    sendJson(response, 200, await getLiveness());
    return;
  }

  if (url.pathname === "/health/ready") {
    const readiness = await getReadiness();
    sendJson(response, readiness.status === "ready" ? 200 : 503, readiness);
    return;
  }

  if (url.pathname === "/health/details") {
    const details = await getHealthDetails();
    sendJson(response, details.status === "ok" ? 200 : 503, details);
    return;
  }

  sendJson(response, 404, {
    status: "error",
    message: "Route not found."
  });
}
