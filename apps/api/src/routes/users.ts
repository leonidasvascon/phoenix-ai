import type { IncomingMessage, ServerResponse } from "node:http";
import { getUser, listUsers, setUserStatus, updateUser } from "@phoenix-ai/identity";
import { sendJson } from "../http.ts";
import { readJsonBody } from "../read-json.ts";

export async function handleUsersRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const pathname = url.pathname;

  if (pathname === "/users" && request.method === "GET") {
    sendJson(response, 200, await listUsers());
    return;
  }

  const userId = decodeURIComponent(pathname.split("/")[2] ?? "");
  if (!userId) {
    sendJson(response, 404, { error: { code: "USER_NOT_FOUND", message: "Usuario nao encontrado.", status: 404 } });
    return;
  }

  if (request.method === "GET") {
    const user = await getUser(userId);
    sendJson(response, user ? 200 : 404, user ?? { error: { code: "USER_NOT_FOUND", message: "Usuario nao encontrado.", status: 404 } });
    return;
  }

  if (request.method === "PATCH") {
    sendJson(response, 200, await updateUser(userId, await readJsonBody(request)));
    return;
  }

  if (pathname.endsWith("/disable") && request.method === "POST") {
    sendJson(response, 200, await setUserStatus(userId, "disabled"));
    return;
  }

  if (pathname.endsWith("/enable") && request.method === "POST") {
    sendJson(response, 200, await setUserStatus(userId, "active"));
    return;
  }

  sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Metodo nao permitido.", status: 405 } });
}
