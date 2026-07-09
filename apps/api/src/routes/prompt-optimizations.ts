import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { generatePromptOptimizations, listPromptOptimizations } from "../services/prompt-optimization-service.ts";

export async function handlePromptOptimizationsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (request.method === "GET" && url.pathname === "/prompt-optimizations") {
    sendJson(response, 200, await listPromptOptimizations());
    return;
  }

  if (request.method === "POST" && url.pathname === "/prompt-optimizations/generate") {
    sendJson(response, 200, await generatePromptOptimizations());
    return;
  }

  sendJson(response, 404, {
    status: "error",
    message: "Prompt optimizations route not found."
  });
}
