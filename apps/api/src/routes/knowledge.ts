import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { readJsonBody } from "../read-json.ts";
import { getKnowledgeGraph, ingestKnowledge, listKnowledgeEntities, listKnowledgeRelations, searchKnowledge } from "../services/knowledge-service.ts";

export async function handleKnowledgeRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const pathname = url.pathname;

  try {
    if (request.method === "GET" && pathname === "/knowledge/entities") {
      sendJson(response, 200, await listKnowledgeEntities());
      return;
    }

    if (request.method === "GET" && pathname === "/knowledge/relations") {
      sendJson(response, 200, await listKnowledgeRelations());
      return;
    }

    if (request.method === "GET" && pathname === "/knowledge/graph") {
      sendJson(response, 200, await getKnowledgeGraph());
      return;
    }

    if (request.method === "GET" && pathname === "/knowledge/search") {
      sendJson(response, 200, await searchKnowledge({
        query: url.searchParams.get("q") ?? url.searchParams.get("query") ?? "",
        workspace_id: url.searchParams.get("workspace_id") ?? undefined,
        limit: Number(url.searchParams.get("limit") ?? 8)
      }));
      return;
    }

    if (request.method === "POST" && pathname === "/knowledge/ingest") {
      sendJson(response, 200, await ingestKnowledge(await readJsonBody(request)));
      return;
    }
  } catch (error) {
    sendJson(response, 400, {
      error: {
        code: "KNOWLEDGE_ERROR",
        message: error instanceof Error ? error.message : "Knowledge operation failed.",
        status: 400
      }
    });
    return;
  }

  sendJson(response, 404, { error: { code: "KNOWLEDGE_NOT_FOUND", message: "Knowledge route not found.", status: 404 } });
}
