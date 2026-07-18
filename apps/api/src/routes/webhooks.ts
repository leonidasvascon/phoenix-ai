import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { readJsonBody } from "../read-json.ts";
import { createWebhookEndpoint, deleteWebhookEndpoint, getWebhookEndpoint, listWebhookEndpoints, testWebhookEndpoint, updateWebhookEndpoint } from "../services/event-service.ts";

export async function handleWebhooksRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, webhookId, action] = url.pathname.split("/").filter(Boolean);

  try {
    if (request.method === "GET" && !webhookId) {
      sendJson(response, 200, await listWebhookEndpoints());
      return;
    }

    if (request.method === "POST" && !webhookId) {
      sendJson(response, 201, await createWebhookEndpoint(await readJsonBody(request)));
      return;
    }

    if (request.method === "GET" && webhookId) {
      const webhook = await getWebhookEndpoint(webhookId);
      sendJson(response, webhook ? 200 : 404, webhook ?? { error: { code: "WEBHOOK_NOT_FOUND", message: "Webhook not found.", status: 404 } });
      return;
    }

    if (request.method === "PATCH" && webhookId) {
      const webhook = await updateWebhookEndpoint(webhookId, await readJsonBody(request));
      sendJson(response, webhook ? 200 : 404, webhook ?? { error: { code: "WEBHOOK_NOT_FOUND", message: "Webhook not found.", status: 404 } });
      return;
    }

    if (request.method === "DELETE" && webhookId) {
      const deleted = await deleteWebhookEndpoint(webhookId);
      sendJson(response, deleted ? 200 : 404, deleted ? { status: "deleted", id: webhookId } : { error: { code: "WEBHOOK_NOT_FOUND", message: "Webhook not found.", status: 404 } });
      return;
    }

    if (request.method === "POST" && webhookId && action === "test") {
      sendJson(response, 200, await testWebhookEndpoint(webhookId));
      return;
    }
  } catch (error) {
    sendJson(response, 400, { error: { code: "WEBHOOK_ERROR", message: error instanceof Error ? error.message : "Webhook operation failed.", status: 400 } });
    return;
  }

  sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed.", status: 405 } });
}
