import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getEventById, listEventHistory } from "../services/event-service.ts";

export async function handleEventsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, eventId] = url.pathname.split("/").filter(Boolean);

  if (request.method === "GET" && !eventId) {
    sendJson(response, 200, await listEventHistory());
    return;
  }

  if (request.method === "GET" && eventId) {
    const event = await getEventById(eventId);
    sendJson(response, event ? 200 : 404, event ?? { error: { code: "EVENT_NOT_FOUND", message: "Event not found.", status: 404 } });
    return;
  }

  sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed.", status: 405 } });
}
