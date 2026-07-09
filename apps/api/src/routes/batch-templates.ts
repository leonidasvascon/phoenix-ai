import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { createBatchTemplate, deleteBatchTemplate, listBatchTemplates, updateBatchTemplate } from "../services/batch-template-service.ts";

export async function handleBatchTemplatesRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, , templateId] = url.pathname.split("/");

  if (request.method === "GET" && !templateId) {
    sendJson(response, 200, await listBatchTemplates());
    return;
  }

  if (request.method === "POST" && !templateId) {
    try {
      const payload = await readJsonBody(request);
      sendJson(response, 201, await createBatchTemplate(payload));
    } catch (error) {
      sendJson(response, 400, {
        status: "error",
        message: error instanceof Error ? error.message : "Invalid batch template."
      });
    }
    return;
  }

  if (request.method === "PUT" && templateId) {
    try {
      const payload = await readJsonBody(request);
      const template = await updateBatchTemplate(templateId, payload);

      if (!template) {
        sendJson(response, 404, {
          status: "error",
          message: "Batch template not found."
        });
        return;
      }

      sendJson(response, 200, template);
    } catch (error) {
      sendJson(response, 400, {
        status: "error",
        message: error instanceof Error ? error.message : "Invalid batch template."
      });
    }
    return;
  }

  if (request.method === "DELETE" && templateId) {
    const deleted = await deleteBatchTemplate(templateId);

    if (!deleted) {
      sendJson(response, 404, {
        status: "error",
        message: "Batch template not found."
      });
      return;
    }

    sendJson(response, 200, {
      status: "deleted",
      id: templateId
    });
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

  if (!body.trim()) {
    throw new Error("Request body is required.");
  }

  return JSON.parse(body) as unknown;
}
