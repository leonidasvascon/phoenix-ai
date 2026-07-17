import type { IncomingMessage, ServerResponse } from "node:http";
import { acceptInvitation, findInvitationByToken, rejectInvitation } from "@phoenix-ai/workspace";
import { createLocalUser, findUserByEmail } from "@phoenix-ai/identity";
import { sendJson } from "../http.ts";
import { readJsonBody } from "../read-json.ts";

export async function handleInvitationsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const token = decodeURIComponent(url.pathname.split("/")[2] ?? "");
  const record = token ? await findInvitationByToken(token) : null;

  if (!record) {
    sendJson(response, 404, { error: { code: "INVITATION_NOT_FOUND", message: "Convite nao encontrado.", status: 404 } });
    return;
  }

  if (request.method === "GET") {
    sendJson(response, 200, publicInvitation(record));
    return;
  }

  if (url.pathname.endsWith("/accept") && request.method === "POST") {
    const payload = await readJsonBody(request) as { name?: string; password?: string };
    let user = await findUserByEmail(record.invitation.email);
    if (!user) {
      if (!payload.password || !payload.name) throw new Error("Name and password are required to accept invitation.");
      user = await createLocalUser({ email: record.invitation.email, name: payload.name, password: payload.password, email_verified: true });
    }
    const invitation = await acceptInvitation(record.workspaceId, record.invitation.id, {
      user_id: user.id,
      name: user.name,
      email: user.email
    });
    sendJson(response, 200, publicInvitation({ workspaceId: record.workspaceId, invitation }));
    return;
  }

  if (url.pathname.endsWith("/reject") && request.method === "POST") {
    const invitation = await rejectInvitation(record.workspaceId, record.invitation.id);
    sendJson(response, 200, publicInvitation({ workspaceId: record.workspaceId, invitation }));
    return;
  }

  sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Metodo nao permitido.", status: 405 } });
}

function publicInvitation(record: Awaited<ReturnType<typeof findInvitationByToken>> extends infer T ? NonNullable<T> : never) {
  const { token_hash: _tokenHash, ...invitation } = record.invitation;
  return { workspace_id: record.workspaceId, invitation };
}
