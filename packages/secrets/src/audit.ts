import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createTraceId, getTraceId } from "@phoenix-ai/observability";
import { auditRoot } from "./secret-repository.ts";
import { sanitizeSecretPayload } from "./sanitization.ts";
import type { SecretAccessContext } from "./types.ts";

export async function auditSecret(event: string, input: {
  secretId?: string;
  namespace?: string;
  workspaceId?: string;
  actorType?: string;
  actorId?: string;
  provider?: string;
  version?: number;
  result: "success" | "failure" | "info";
  reasonCode?: string;
  context?: Partial<SecretAccessContext>;
}): Promise<void> {
  await mkdir(auditRoot(), { recursive: true });
  const record = sanitizeSecretPayload({
    timestamp: new Date().toISOString(),
    event,
    secret_id: input.secretId ?? null,
    namespace: input.namespace ?? null,
    workspace_id: input.workspaceId ?? input.context?.workspaceId ?? null,
    actor_type: input.actorType ?? input.context?.actorType ?? null,
    actor_id: input.actorId ?? input.context?.actorId ?? null,
    provider: input.provider,
    version: input.version,
    result: input.result,
    reason_code: input.reasonCode,
    trace_id: input.context?.traceId ?? getTraceId() ?? createTraceId()
  });
  await writeFile(resolve(auditRoot(), "secrets.jsonl"), `${JSON.stringify(record)}\n`, { encoding: "utf8", flag: "a" });
}
