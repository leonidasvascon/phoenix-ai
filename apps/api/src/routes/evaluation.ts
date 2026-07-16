import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getLatestEvaluationReport, runEvaluation } from "../services/evaluation-service.ts";

export async function handleEvaluationRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (request.method === "GET" && url.pathname === "/evaluation") {
    const report = await getLatestEvaluationReport();

    if (!report) {
      sendJson(response, 200, {
        status: "empty",
        message: "No evaluation report generated yet."
      });
      return;
    }

    sendJson(response, 200, report);
    return;
  }

  if (request.method === "POST" && url.pathname === "/evaluation/run") {
    sendJson(response, 200, await runEvaluation());
    return;
  }

  sendJson(response, 405, {
    status: "error",
    message: "Method not allowed."
  });
}
