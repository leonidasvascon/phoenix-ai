import type { PhoenixClient } from "../client.ts";
import type { PhoenixWorkspace, PhoenixWorkspaceMember, PhoenixWorkspaceRole } from "../types.ts";

export class WorkspacesResource {
  private readonly client: PhoenixClient;
  constructor(client: PhoenixClient) { this.client = client; }
  list(): Promise<PhoenixWorkspace[]> { return this.client.request("/workspaces"); }
  get(id: string): Promise<PhoenixWorkspace> { return this.client.request(`/workspaces/${encodeURIComponent(id)}`); }
  create(input: { name: string; settings?: Record<string, unknown> }): Promise<PhoenixWorkspace> { return this.client.request("/workspaces", { method: "POST", body: input }); }
  update(id: string, input: { name?: string; settings?: Record<string, unknown> }): Promise<PhoenixWorkspace> { return this.client.request(`/workspaces/${encodeURIComponent(id)}`, { method: "PATCH", body: input }); }
  members(id: string): Promise<PhoenixWorkspaceMember[]> { return this.client.request(`/workspaces/${encodeURIComponent(id)}/members`); }
  addMember(id: string, input: { user_id?: string; name: string; email?: string; role: PhoenixWorkspaceRole }): Promise<PhoenixWorkspaceMember> { return this.client.request(`/workspaces/${encodeURIComponent(id)}/members`, { method: "POST", body: input }); }
  updateMember(id: string, memberId: string, input: { role?: PhoenixWorkspaceRole; status?: "active" | "invited" | "disabled" }): Promise<PhoenixWorkspaceMember> { return this.client.request(`/workspaces/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`, { method: "PATCH", body: input }); }
  removeMember(id: string, memberId: string): Promise<{ status: "deleted"; id: string }> { return this.client.request(`/workspaces/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`, { method: "DELETE" }); }
}
