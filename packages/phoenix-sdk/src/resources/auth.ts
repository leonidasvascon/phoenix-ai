import type { PhoenixClient } from "../client.ts";
import type { PhoenixSession, PhoenixUser } from "../types.ts";

export class AuthResource {
  private readonly client: PhoenixClient;

  constructor(client: PhoenixClient) {
    this.client = client;
  }

  login(input: { email: string; password: string }): Promise<{ user: PhoenixUser; session: PhoenixSession }> {
    return this.client.request("/auth/login", { method: "POST", body: input });
  }

  me(): Promise<{ user: PhoenixUser; session: PhoenixSession }> {
    return this.client.request("/auth/me");
  }

  logout(): Promise<{ status: string }> {
    return this.client.request("/auth/logout", { method: "POST" });
  }

  sessions(): Promise<PhoenixSession[]> {
    return this.client.request("/auth/sessions");
  }

  revokeSession(id: string): Promise<{ status: string }> {
    return this.client.request(`/auth/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  providers(): Promise<Array<{ id: string; configured: boolean; ready: boolean }>> {
    return this.client.request("/auth/providers");
  }

  acceptInvitation(token: string, input: { name: string; password: string }): Promise<unknown> {
    return this.client.request(`/invitations/${encodeURIComponent(token)}/accept`, { method: "POST", body: input });
  }
}
