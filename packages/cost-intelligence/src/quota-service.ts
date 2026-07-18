import { randomUUID } from "node:crypto";
import { costPath, readJson, writeJson } from "./storage.ts";
import type { CostUsageRecord, Quota } from "./types.ts";

export class QuotaService {
  private readonly path: string;

  constructor(path = costPath("quotas", "quotas.json")) {
    this.path = path;
  }

  async list(): Promise<Quota[]> {
    const quotas = await readJson<Quota[]>(this.path, []);
    if (quotas.length) return quotas;
    const defaults = [defaultQuota("default-workspace")];
    await this.save(defaults);
    return defaults;
  }

  async update(input: Partial<Quota> & { workspace_id?: string }): Promise<Quota> {
    const quotas = await this.list();
    const workspaceId = input.workspace_id ?? "default-workspace";
    const current = quotas.find((quota) => quota.workspace_id === workspaceId) ?? defaultQuota(workspaceId);
    const next = { ...current, ...input, workspace_id: workspaceId, updated_at: new Date().toISOString() };
    await this.save([...quotas.filter((quota) => quota.workspace_id !== workspaceId), next]);
    return next;
  }

  async check(workspaceId: string, records: CostUsageRecord[]): Promise<{ allowed: boolean; quota: Quota; reason?: string }> {
    const quota = (await this.list()).find((item) => item.workspace_id === workspaceId) ?? defaultQuota(workspaceId);
    const now = Date.now();
    const minute = records.filter((record) => record.workspace_id === workspaceId && now - Date.parse(record.timestamp) <= 60000);
    const hour = records.filter((record) => record.workspace_id === workspaceId && now - Date.parse(record.timestamp) <= 3600000);
    const day = records.filter((record) => record.workspace_id === workspaceId && now - Date.parse(record.timestamp) <= 86400000);
    if (minute.length >= quota.requests_per_minute) return { allowed: false, quota, reason: "requests_per_minute exceeded" };
    if (hour.reduce((sum, record) => sum + record.total_tokens, 0) >= quota.tokens_per_hour) return { allowed: false, quota, reason: "tokens_per_hour exceeded" };
    if (day.reduce((sum, record) => sum + record.consolidated_cost, 0) >= quota.daily_cost) return { allowed: false, quota, reason: "daily_cost exceeded" };
    return { allowed: true, quota };
  }

  private async save(quotas: Quota[]): Promise<void> {
    await writeJson(this.path, quotas);
  }
}

function defaultQuota(workspaceId: string): Quota {
  return {
    id: randomUUID(),
    workspace_id: workspaceId,
    requests_per_minute: 120,
    tokens_per_hour: 250000,
    daily_cost: 10,
    monthly_cost: 250,
    updated_at: new Date().toISOString()
  };
}
