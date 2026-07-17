import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { disablePlugin, enablePlugin, getPlugin, installPlugin, listPlugins, uninstallPlugin } from "@phoenix-ai/plugin-sdk";

export async function handlePluginsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const segments = url.pathname.split("/").filter(Boolean);

  try {
    if (request.method === "GET" && segments.length === 1) {
      sendJson(response, 200, await listPlugins());
      return;
    }

    if (request.method === "GET" && segments.length === 2) {
      const plugin = await getPlugin(segments[1]);
      if (!plugin) {
        sendJson(response, 404, { status: "error", message: "Plugin not found." });
        return;
      }
      sendJson(response, 200, plugin);
      return;
    }

    if (request.method === "POST" && segments[1] === "install") {
      sendJson(response, 200, await installPlugin(await readJsonBody(request)));
      return;
    }

    if (request.method === "POST" && segments[1] === "enable") {
      sendJson(response, 200, await enablePlugin(await readJsonBody(request)));
      return;
    }

    if (request.method === "POST" && segments[1] === "disable") {
      sendJson(response, 200, await disablePlugin(await readJsonBody(request)));
      return;
    }

    if (request.method === "DELETE" && segments.length === 2) {
      sendJson(response, 200, await uninstallPlugin(segments[1]));
      return;
    }
  } catch (error) {
    sendJson(response, 400, {
      status: "error",
      message: error instanceof Error ? error.message : "Plugin operation failed."
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
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const body = Buffer.concat(chunks).toString("utf8");
  return body.trim() ? JSON.parse(body) : {};
}
