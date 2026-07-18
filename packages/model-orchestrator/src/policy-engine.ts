import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { ModelPolicy, ModelTaskType } from "./model-selection.ts";

export const defaultPolicy: ModelPolicy = {
  workspace_id: "default-workspace",
  default_policy: "fallback",
  fallback_order: ["openai", "anthropic", "google", "azure-openai", "ollama", "mock"],
  task_policies: {
    agent: "task_affinity",
    embedding: "lowest_cost",
    general: "fallback"
  },
  preferred_models: {}
};

export class PolicyEngine {
  private readonly path: string;

  constructor(path = resolve(process.cwd(), ".storage", "models", "policies.json")) {
    this.path = path;
  }

  async getPolicy(workspaceId = "default-workspace"): Promise<ModelPolicy> {
    const policies = await this.readPolicies();
    return policies.find((policy) => policy.workspace_id === workspaceId) ?? { ...defaultPolicy, workspace_id: workspaceId };
  }

  async listPolicies(): Promise<ModelPolicy[]> {
    const policies = await this.readPolicies();
    if (!policies.length) return [defaultPolicy];
    return policies;
  }

  async updatePolicy(input: Partial<ModelPolicy> & { workspace_id?: string }): Promise<ModelPolicy> {
    const workspaceId = input.workspace_id ?? "default-workspace";
    const policies = await this.readPolicies();
    const current = policies.find((policy) => policy.workspace_id === workspaceId) ?? { ...defaultPolicy, workspace_id: workspaceId };
    const next: ModelPolicy = {
      ...current,
      ...input,
      workspace_id: workspaceId,
      task_policies: { ...current.task_policies, ...input.task_policies },
      preferred_models: { ...current.preferred_models, ...input.preferred_models },
      fallback_order: input.fallback_order?.length ? input.fallback_order : current.fallback_order
    };
    await this.writePolicies([...policies.filter((policy) => policy.workspace_id !== workspaceId), next]);
    return next;
  }

  resolvePolicy(policy: ModelPolicy, taskType: ModelTaskType): ModelPolicy["default_policy"] {
    return policy.task_policies[taskType] ?? policy.default_policy;
  }

  private async readPolicies(): Promise<ModelPolicy[]> {
    try {
      const parsed = JSON.parse(await readFile(this.path, "utf8")) as ModelPolicy[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async writePolicies(policies: ModelPolicy[]): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, `${JSON.stringify(policies, null, 2)}\n`);
  }
}
