import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { readJsonBody } from "../read-json.ts";
import { clearCostCache, getCostBudgets, getCostCache, getCostPricing, getCostQuotas, getCostReport, getCostUsage, updateCostBudget, updateCostQuota } from "../services/cost-service.ts";

export async function handleCostRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const pathname = url.pathname;

  try {
    if (request.method === "GET" && pathname === "/cost") {
      sendJson(response, 200, await getCostReport());
      return;
    }
    if (request.method === "GET" && pathname === "/cost/usage") {
      sendJson(response, 200, await getCostUsage());
      return;
    }
    if (request.method === "GET" && pathname === "/cost/budgets") {
      sendJson(response, 200, await getCostBudgets());
      return;
    }
    if (request.method === "PATCH" && pathname === "/cost/budgets") {
      sendJson(response, 200, await updateCostBudget(await readJsonBody(request)));
      return;
    }
    if (request.method === "GET" && pathname === "/cost/quotas") {
      sendJson(response, 200, await getCostQuotas());
      return;
    }
    if (request.method === "PATCH" && pathname === "/cost/quotas") {
      sendJson(response, 200, await updateCostQuota(await readJsonBody(request)));
      return;
    }
    if (request.method === "GET" && pathname === "/cost/pricing") {
      sendJson(response, 200, await getCostPricing());
      return;
    }
    if (request.method === "GET" && pathname === "/cost/cache") {
      sendJson(response, 200, await getCostCache());
      return;
    }
    if (request.method === "POST" && pathname === "/cost/cache/clear") {
      sendJson(response, 200, await clearCostCache());
      return;
    }
  } catch (error) {
    sendJson(response, 400, {
      error: {
        code: "COST_INTELLIGENCE_ERROR",
        message: error instanceof Error ? error.message : "Cost intelligence operation failed.",
        status: 400
      }
    });
    return;
  }

  sendJson(response, 404, { error: { code: "COST_NOT_FOUND", message: "Cost route not found.", status: 404 } });
}
