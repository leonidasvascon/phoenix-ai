import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { decryptSecret, encryptSecret, type EncryptedPayload } from "@phoenix-ai/secrets";

export type SocialConnectionStatus = "connected" | "invalid" | "expired" | "missing_permissions" | "disconnected";

export type SocialConnectionRecord = {
  id: string;
  workspaceId: string;
  brandId?: string;
  provider: "instagram";
  accountId: string;
  accountUsername?: string;
  accountName?: string;
  accountType?: "business" | "creator";
  facebookPageId?: string;
  graphApiVersion: string;
  publicMediaBaseUrl?: string;
  accessTokenEncrypted: EncryptedPayload;
  accessTokenPreview: string;
  tokenExpiresAt?: string;
  status: SocialConnectionStatus;
  permissions: string[];
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SafeSocialConnection = Omit<SocialConnectionRecord, "accessTokenEncrypted"> & {
  accessTokenMasked: string;
  configured: boolean;
  ready: boolean;
};

export type SocialConnectionTestResult = {
  status: "success" | "incomplete";
  ready: boolean;
  message: string;
  checks: Array<{ name: string; passed: boolean; message: string }>;
  connection: SafeSocialConnection;
};

type InstagramPayload = {
  workspaceId?: string;
  brandId?: string;
  accountId?: string;
  accountUsername?: string;
  accountName?: string;
  accountType?: "business" | "creator";
  facebookPageId?: string;
  graphApiVersion?: string;
  publicMediaBaseUrl?: string;
  accessToken?: string;
  tokenExpiresAt?: string;
  permissions?: string[];
};

const storePath = join(".storage", "social-connections", "connections.json");
const requiredPermissions = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement"
];

export async function listSocialConnections(workspaceId?: string): Promise<SafeSocialConnection[]> {
  const records = await readStore();
  return records
    .filter((connection) => !workspaceId || connection.workspaceId === workspaceId)
    .map(toSafeConnection);
}

export async function getSocialConnection(id: string, workspaceId?: string): Promise<SafeSocialConnection | null> {
  const record = (await readStore()).find((connection) => connection.id === id && (!workspaceId || connection.workspaceId === workspaceId));
  return record ? toSafeConnection(record) : null;
}

export async function createInstagramConnection(payload: InstagramPayload, workspaceId: string): Promise<SafeSocialConnection> {
  const now = new Date().toISOString();
  const accountId = requiredString(payload.accountId, "ID da conta do Instagram");
  const graphApiVersion = requiredString(payload.graphApiVersion, "Versão da Graph API");
  const accessToken = requiredString(payload.accessToken, "Token de acesso");
  const record: SocialConnectionRecord = {
    id: randomUUID(),
    workspaceId: payload.workspaceId ?? workspaceId,
    brandId: normalizeOptional(payload.brandId),
    provider: "instagram",
    accountId,
    accountUsername: normalizeOptional(payload.accountUsername),
    accountName: normalizeOptional(payload.accountName),
    accountType: payload.accountType ?? "business",
    facebookPageId: normalizeOptional(payload.facebookPageId),
    graphApiVersion,
    publicMediaBaseUrl: normalizeOptional(payload.publicMediaBaseUrl),
    accessTokenEncrypted: encryptSecret(accessToken),
    accessTokenPreview: maskToken(accessToken),
    tokenExpiresAt: normalizeOptional(payload.tokenExpiresAt),
    status: "invalid",
    permissions: normalizePermissions(payload.permissions),
    createdAt: now,
    updatedAt: now
  };
  const tested = await testRecord(record);
  record.status = tested.ready ? "connected" : "missing_permissions";
  record.lastCheckedAt = now;

  const records = await readStore();
  records.push(record);
  await writeStore(records);

  return toSafeConnection(record);
}

export async function updateSocialConnection(id: string, payload: InstagramPayload, workspaceId?: string): Promise<SafeSocialConnection | null> {
  const records = await readStore();
  const index = records.findIndex((connection) => connection.id === id && (!workspaceId || connection.workspaceId === workspaceId));
  if (index === -1) return null;

  const existing = records[index];
  const now = new Date().toISOString();
  const accessToken = normalizeOptional(payload.accessToken);
  const updated: SocialConnectionRecord = {
    ...existing,
    brandId: payload.brandId !== undefined ? normalizeOptional(payload.brandId) : existing.brandId,
    accountId: payload.accountId ? payload.accountId.trim() : existing.accountId,
    accountUsername: payload.accountUsername !== undefined ? normalizeOptional(payload.accountUsername) : existing.accountUsername,
    accountName: payload.accountName !== undefined ? normalizeOptional(payload.accountName) : existing.accountName,
    accountType: payload.accountType ?? existing.accountType,
    facebookPageId: payload.facebookPageId !== undefined ? normalizeOptional(payload.facebookPageId) : existing.facebookPageId,
    graphApiVersion: payload.graphApiVersion ? payload.graphApiVersion.trim() : existing.graphApiVersion,
    publicMediaBaseUrl: payload.publicMediaBaseUrl !== undefined ? normalizeOptional(payload.publicMediaBaseUrl) : existing.publicMediaBaseUrl,
    accessTokenEncrypted: accessToken ? encryptSecret(accessToken) : existing.accessTokenEncrypted,
    accessTokenPreview: accessToken ? maskToken(accessToken) : existing.accessTokenPreview,
    tokenExpiresAt: payload.tokenExpiresAt !== undefined ? normalizeOptional(payload.tokenExpiresAt) : existing.tokenExpiresAt,
    permissions: payload.permissions ? normalizePermissions(payload.permissions) : existing.permissions,
    updatedAt: now
  };
  const tested = await testRecord(updated);
  updated.status = tested.ready ? "connected" : "missing_permissions";
  updated.lastCheckedAt = now;
  records[index] = updated;
  await writeStore(records);

  return toSafeConnection(updated);
}

export async function deleteSocialConnection(id: string, workspaceId?: string): Promise<boolean> {
  const records = await readStore();
  const next = records.filter((connection) => connection.id !== id || (workspaceId !== undefined && connection.workspaceId !== workspaceId));
  if (next.length === records.length) return false;
  await writeStore(next);
  return true;
}

export async function testSocialConnection(id: string, workspaceId?: string): Promise<SocialConnectionTestResult | null> {
  const records = await readStore();
  const index = records.findIndex((connection) => connection.id === id && (!workspaceId || connection.workspaceId === workspaceId));
  if (index === -1) return null;

  const result = await testRecord(records[index]);
  records[index] = {
    ...records[index],
    status: result.ready ? "connected" : "missing_permissions",
    lastCheckedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await writeStore(records);

  return {
    ...result,
    connection: toSafeConnection(records[index])
  };
}

export async function getConnectionPermissions(id: string, workspaceId?: string): Promise<{ required: string[]; granted: string[]; missing: string[] } | null> {
  const record = (await readStore()).find((connection) => connection.id === id && (!workspaceId || connection.workspaceId === workspaceId));
  if (!record) return null;
  const granted = record.permissions;
  return {
    required: requiredPermissions,
    granted,
    missing: requiredPermissions.filter((permission) => !granted.includes(permission))
  };
}

export async function getConnectionAccounts(id: string, workspaceId?: string): Promise<Array<{ accountId: string; username?: string; name?: string; type?: string }> | null> {
  const record = (await readStore()).find((connection) => connection.id === id && (!workspaceId || connection.workspaceId === workspaceId));
  if (!record) return null;
  return [{
    accountId: record.accountId,
    username: record.accountUsername,
    name: record.accountName,
    type: record.accountType
  }];
}

async function testRecord(record: SocialConnectionRecord): Promise<Omit<SocialConnectionTestResult, "connection">> {
  const token = safeDecrypt(record.accessTokenEncrypted);
  const missingPermissions = requiredPermissions.filter((permission) => !record.permissions.includes(permission));
  const checks = [
    {
      name: "access_token",
      passed: Boolean(token && token.length >= 20 && !token.toLowerCase().includes("invalid")),
      message: "Token de acesso configurado e com formato aceitável."
    },
    {
      name: "account",
      passed: Boolean(record.accountId.trim()),
      message: "Conta do Instagram informada."
    },
    {
      name: "account_type",
      passed: record.accountType === "business" || record.accountType === "creator",
      message: "Conta Business ou Creator."
    },
    {
      name: "graph_api_version",
      passed: /^v\d+\.\d+$/.test(record.graphApiVersion),
      message: "Versão da Graph API configurada."
    },
    {
      name: "permissions",
      passed: missingPermissions.length === 0,
      message: missingPermissions.length === 0
        ? "Permissões necessárias concedidas."
        : `Permissões ausentes: ${missingPermissions.join(", ")}.`
    },
    {
      name: "public_media_base_url",
      passed: isValidPublicMediaUrl(record.publicMediaBaseUrl),
      message: "URL pública dos arquivos disponível por HTTPS."
    }
  ];
  const ready = checks.every((check) => check.passed);

  return {
    status: ready ? "success" : "incomplete",
    ready,
    message: ready
      ? `Conta ${formatAccount(record)} pronta para publicação.`
      : "Conexão incompleta.",
    checks
  };
}

function toSafeConnection(record: SocialConnectionRecord): SafeSocialConnection {
  const { accessTokenEncrypted: _accessTokenEncrypted, ...safe } = record;
  return {
    ...safe,
    accessTokenMasked: record.accessTokenPreview,
    configured: true,
    ready: record.status === "connected"
  };
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} é obrigatório.`);
  return value.trim();
}

function normalizeOptional(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.trim()).map((item) => item.trim())));
}

function maskToken(token: string): string {
  if (token.length <= 8) return "••••";
  return `${token.slice(0, 4)}${"•".repeat(12)}${token.slice(-4)}`;
}

function safeDecrypt(payload: EncryptedPayload): string {
  try {
    return decryptSecret(payload);
  } catch {
    return "";
  }
}

function isValidPublicMediaUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname) && !url.href.startsWith("file:");
  } catch {
    return false;
  }
}

function formatAccount(record: SocialConnectionRecord): string {
  return record.accountUsername ? `@${record.accountUsername.replace(/^@/, "")}` : record.accountId;
}

async function readStore(): Promise<SocialConnectionRecord[]> {
  try {
    return JSON.parse(await readFile(storePath, "utf8")) as SocialConnectionRecord[];
  } catch {
    await mkdir(dirname(storePath), { recursive: true });
    await writeStore([]);
    return [];
  }
}

async function writeStore(records: SocialConnectionRecord[]): Promise<void> {
  await mkdir(dirname(storePath), { recursive: true });
  if (records.length === 0) {
    await rm(storePath, { force: true }).catch(() => undefined);
    await writeFile(storePath, "[]\n", "utf8");
    return;
  }
  await writeFile(storePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}
