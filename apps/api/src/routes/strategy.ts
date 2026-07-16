import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { generateStrategyPlan, getLatestStrategyPlan } from "../services/strategy-service.ts";

export async function handleStrategyRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (request.method === "GET" && url.pathname === "/strategy") {
    const plan = await getLatestStrategyPlan();

    if (!plan) {
      sendJson(response, 200, {
        status: "empty",
        message: "No strategy plan generated yet."
      });
      return;
    }

    sendJson(response, 200, plan);
    return;
  }

  if (request.method === "POST" && url.pathname === "/strategy/generate") {
    try {
      sendJson(response, 200, await generateStrategyPlan(await readJsonBody(request)));
    } catch (error) {
      sendJson(response, 400, {
        status: "error",
        message: error instanceof Error ? error.message : "Invalid strategy request."
      });
    }
    return;
  }

  sendJson(response, 405, {
    status: "error",
    message: "Method not allowed."
  });
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");

  if (!body.trim()) return {};

  return JSON.parse(body) as unknown;
}
