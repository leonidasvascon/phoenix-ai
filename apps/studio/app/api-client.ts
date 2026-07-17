const apiUrl = process.env.NEXT_PUBLIC_PHOENIX_API_URL ?? "http://127.0.0.1:4000";
const configuredApiKey = process.env.NEXT_PUBLIC_PHOENIX_API_KEY ?? "";
const storageKey = "phoenix-api-key";
const workspaceStorageKey = "phoenix-workspace-id";

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const apiKey = getApiKey();

  if (apiKey) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }

  const workspaceId = getWorkspaceId();
  if (workspaceId) {
    headers.set("X-Phoenix-Workspace-Id", workspaceId);
  }

  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers
  });
}

export function saveApiKey(apiKey: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, apiKey);
  }
}

export function clearApiKey(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(storageKey);
  }
}

export function getApiKey(): string {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(storageKey) ?? "";
  }

  return "";
}

export function getConfiguredApiKey(): string {
  return configuredApiKey;
}

export function saveWorkspaceId(workspaceId: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(workspaceStorageKey, workspaceId);
  }
}

export function getWorkspaceId(): string {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(workspaceStorageKey) ?? "";
  }

  return "";
}
