import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { readJsonBody } from "../read-json.ts";
import { getModelHealth, getModelPolicies, listModelProviders, listModels, testModel, updateModelPolicy } from "../services/model-service.ts";

export async function handleModelsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const pathname = url.pathname;

  try {
    if (request.method === "GET" && pathname === "/models") {
      sendJson(response, 200, await listModels());
      return;
    }
    if (request.method === "GET" && pathname === "/models/providers") {
      sendJson(response, 200, listModelProviders());
      return;
    }
    if (request.method === "GET" && pathname === "/models/health") {
      sendJson(response, 200, await getModelHealth());
      return;
    }
    if (request.method === "GET" && pathname === "/models/policies") {
      sendJson(response, 200, await getModelPolicies());
      return;
    }
    if (request.method === "PATCH" && pathname === "/models/policies") {
      sendJson(response, 200, await updateModelPolicy(await readJsonBody(request)));
      return;
    }
    if (request.method === "POST" && pathname === "/models/test") {
      sendJson(response, 200, await testModel(await readJsonBody(request)));
      return;
    }
  } catch (error) {
    sendJson(response, 400, {
      error: {
        code: "MODEL_ORCHESTRATION_ERROR",
        message: error instanceof Error ? error.message : "Model orchestration operation failed.",
        status: 400
      }
    });
    return;
  }

  sendJson(response, 404, { error: { code: "MODELS_NOT_FOUND", message: "Models route not found.", status: 404 } });
}
