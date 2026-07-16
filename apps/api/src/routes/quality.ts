import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getLatestQualityReport, getQualityHistory } from "../services/quality-service.ts";

export async function handleQualityRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (request.method === "GET" && url.pathname === "/quality") {
    sendJson(response, 200, await getQualityHistory());
    return;
  }

  if (request.method === "GET" && url.pathname === "/quality/report") {
    const report = await getLatestQualityReport();

    if (!report) {
      sendJson(response, 404, {
        status: "error",
        message: "Quality report not found."
      });
      return;
    }

    sendJson(response, 200, report);
    return;
  }

  sendJson(response, 405, {
    status: "error",
    message: "Method not allowed."
  });
}
