import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getExecutionPackage, getExecutionVideoAsset, listExecutions } from "../services/runtime-service.ts";

export async function handleExecutionsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "GET") {
    sendJson(response, 405, {
      status: "error",
      message: "Method not allowed."
    });
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, , executionId, assetSegment, assetType] = url.pathname.split("/");

  if (executionId) {
    if (assetSegment === "assets" && assetType === "video") {
      const video = await getExecutionVideoAsset(executionId);

      if (!video) {
        sendJson(response, 404, {
          status: "error",
          message: "Video asset not found."
        });
        return;
      }

      response.writeHead(200, {
        "Access-Control-Allow-Origin": process.env.PHOENIX_STUDIO_ORIGIN ?? "http://127.0.0.1:3000",
        "Content-Type": "video/mp4"
      });
      response.end(video);
      return;
    }

    const executionPackage = await getExecutionPackage(executionId);

    if (!executionPackage) {
      sendJson(response, 404, {
        status: "error",
        message: "Execution not found."
      });
      return;
    }

    sendJson(response, 200, executionPackage);
    return;
  }

  sendJson(response, 200, await listExecutions());
}
