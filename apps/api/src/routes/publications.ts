import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { cancelPublication, createPublication, getPublication, listPublications, publishPublication } from "../services/publication-service.ts";

export async function handlePublicationsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, , publicationId, action] = url.pathname.split("/");

  if (request.method === "GET" && !publicationId) {
    sendJson(response, 200, await listPublications());
    return;
  }

  if (request.method === "GET" && publicationId) {
    const publication = await getPublication(publicationId);

    if (!publication) {
      sendJson(response, 404, {
        status: "error",
        message: "Publication not found."
      });
      return;
    }

    sendJson(response, 200, publication);
    return;
  }

  if (request.method === "POST" && !publicationId) {
    try {
      sendJson(response, 201, await createPublication(await readJsonBody(request)));
    } catch (error) {
      sendJson(response, 400, {
        status: "error",
        message: error instanceof Error ? error.message : "Invalid publication."
      });
    }
    return;
  }

  if (request.method === "POST" && publicationId && action === "publish") {
    try {
      sendJson(response, 200, await publishPublication(publicationId));
    } catch (error) {
      sendJson(response, 400, {
        status: "error",
        message: error instanceof Error ? error.message : "Publication failed."
      });
    }
    return;
  }

  if (request.method === "POST" && publicationId && action === "cancel") {
    try {
      sendJson(response, 200, await cancelPublication(publicationId));
    } catch (error) {
      sendJson(response, 400, {
        status: "error",
        message: error instanceof Error ? error.message : "Publication cancellation failed."
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

  if (!body.trim()) {
    throw new Error("Request body is required.");
  }

  return JSON.parse(body) as unknown;
}
