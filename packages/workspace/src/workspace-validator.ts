export function validateWorkspaceId(workspaceId: string): void {
  if (!/^[a-z0-9-]+$/.test(workspaceId)) {
    throw new Error("Invalid workspace id.");
  }
}

export function slugifyWorkspaceName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateEmail(value: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Invalid email.");
  }
}
