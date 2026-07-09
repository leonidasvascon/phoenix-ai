import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getProviderStatus, listProviders } from "../services/provider-service.ts";

export async function handleProvidersRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (request.method === "GET" && url.pathname === "/providers") {
    sendJson(response, 200, listProviders());
    return;
  }

  if (request.method === "GET" && url.pathname === "/providers/status") {
    sendJson(response, 200, getProviderStatus());
    return;
  }

  sendJson(response, 404, {
    status: "error",
    message: "Providers route not found."
  });
}
