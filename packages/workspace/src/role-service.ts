export type WorkspaceRole = "owner" | "admin" | "editor" | "analyst" | "viewer";
export type WorkspaceResource = "brands" | "tasks" | "strategy" | "publishing" | "settings" | "members";
export type WorkspaceAction = "read" | "write" | "manage";

export const defaultRoles: Record<WorkspaceRole, Record<WorkspaceResource, WorkspaceAction[]>> = {
  owner: {
    brands: ["read", "write", "manage"],
    tasks: ["read", "write", "manage"],
    strategy: ["read", "write", "manage"],
    publishing: ["read", "write", "manage"],
    settings: ["read", "write", "manage"],
    members: ["read", "write", "manage"]
  },
  admin: {
    brands: ["read", "write", "manage"],
    tasks: ["read", "write"],
    strategy: ["read", "write"],
    publishing: ["read", "write"],
    settings: ["read", "write"],
    members: ["read", "write", "manage"]
  },
  editor: {
    brands: ["read", "write"],
    tasks: ["read", "write"],
    strategy: ["read", "write"],
    publishing: ["read", "write"],
    settings: [],
    members: []
  },
  analyst: {
    brands: ["read"],
    tasks: ["read"],
    strategy: ["read"],
    publishing: ["read"],
    settings: [],
    members: []
  },
  viewer: {
    brands: ["read"],
    tasks: ["read"],
    strategy: ["read"],
    publishing: [],
    settings: [],
    members: []
  }
};

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return typeof value === "string" && value in defaultRoles;
}

export function hasPermission(role: WorkspaceRole, resource: WorkspaceResource, action: WorkspaceAction): boolean {
  return defaultRoles[role][resource].includes(action);
}
