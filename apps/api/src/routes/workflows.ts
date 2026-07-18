import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { createWorkflow, deleteWorkflow, getWorkflow, listWorkflowExecutions, listWorkflows, runWorkflow, updateWorkflow } from "../services/workflow-service.ts";

export async function handleWorkflowsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, , workflowId, action] = url.pathname.split("/");

  try {
    if (request.method === "GET" && !workflowId) {
      sendJson(response, 200, await listWorkflows());
      return;
    }

    if (request.method === "POST" && !workflowId) {
      sendJson(response, 201, await createWorkflow(await readJsonBody(request, false)));
      return;
    }

    if (request.method === "GET" && workflowId && action === "executions") {
      sendJson(response, 200, await listWorkflowExecutions(workflowId));
      return;
    }

    if (request.method === "GET" && workflowId) {
      const workflow = await getWorkflow(workflowId);
      if (!workflow) {
        sendJson(response, 404, { status: "error", message: "Workflow not found." });
        return;
      }
      sendJson(response, 200, workflow);
      return;
    }

    if (request.method === "PATCH" && workflowId) {
      sendJson(response, 200, await updateWorkflow(workflowId, await readJsonBody(request, false)));
      return;
    }

    if (request.method === "DELETE" && workflowId) {
      const deleted = await deleteWorkflow(workflowId);
      sendJson(response, deleted ? 200 : 404, deleted ? { status: "deleted", id: workflowId } : { status: "error", message: "Workflow not found." });
      return;
    }

    if (request.method === "POST" && workflowId && action === "run") {
      sendJson(response, 200, await runWorkflow(workflowId, await readJsonBody(request, true)));
      return;
    }
  } catch (error) {
    sendJson(response, 400, {
      status: "error",
      message: error instanceof Error ? error.message : "Workflow operation failed."
    });
    return;
  }

  sendJson(response, 405, { status: "error", message: "Method not allowed." });
}

async function readJsonBody(request: IncomingMessage, optional: boolean): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const body = Buffer.concat(chunks).toString("utf8");
  if (!body.trim()) return optional ? {} : {};
  return JSON.parse(body) as unknown;
}
