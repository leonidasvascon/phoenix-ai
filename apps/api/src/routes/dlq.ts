import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { listDeadLetterQueue, retryDeadLetter } from "../services/event-service.ts";

export async function handleDlqRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, itemId, action] = url.pathname.split("/").filter(Boolean);

  try {
    if (request.method === "GET" && !itemId) {
      sendJson(response, 200, await listDeadLetterQueue());
      return;
    }

    if (request.method === "POST" && itemId && action === "retry") {
      sendJson(response, 200, await retryDeadLetter(itemId));
      return;
    }
  } catch (error) {
    sendJson(response, 400, { error: { code: "DLQ_ERROR", message: error instanceof Error ? error.message : "Dead letter operation failed.", status: 400 } });
    return;
  }

  sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed.", status: 405 } });
}
