import type { SecretReference } from "./types.ts";

export function parseSecretReference(reference: string): SecretReference {
  if (reference.startsWith("env://")) {
    const name = reference.slice("env://".length).trim();
    if (!name || !/^[A-Z0-9_]+$/.test(name)) throw new Error("Invalid environment secret reference.");
    return { scheme: "env", name, raw: reference };
  }

  if (!reference.startsWith("secret://")) throw new Error("Invalid secret reference.");
  const [path, query] = reference.slice("secret://".length).split("?");
  const parts = path.split("/").filter(Boolean);
  if (parts.length !== 3) throw new Error("Secret reference must include workspace, namespace and name.");
  const version = new URLSearchParams(query ?? "").get("version");
  return {
    scheme: "secret",
    workspaceId: parts[0],
    namespace: parts[1],
    name: parts[2],
    version: version ? Number(version) : undefined,
    raw: reference
  };
}

export function buildSecretReference(workspaceId: string, namespace: string, name: string): string {
  return `secret://${workspaceId}/${namespace}/${slugSecretName(name)}`;
}

export function slugSecretName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
