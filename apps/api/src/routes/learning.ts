import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getLearningReport } from "../services/learning-service.ts";

export async function handleLearningRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (request.method === "GET" && url.pathname === "/learning") {
    sendJson(response, 200, await getLearningReport());
    return;
  }

  if (request.method === "POST" && url.pathname === "/learning/analyze") {
    sendJson(response, 200, await getLearningReport());
    return;
  }

  sendJson(response, 405, {
    status: "error",
    message: "Method not allowed."
  });
}
