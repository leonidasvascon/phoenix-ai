import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { ProviderRegistry } from "./provider-registry.ts";
import type { ProviderHealth } from "./model-selection.ts";

export class HealthMonitor {
  private readonly registry: ProviderRegistry;
  private readonly path: string;

  constructor(registry: ProviderRegistry, path = resolve(process.cwd(), ".storage", "models", "health.json")) {
    this.registry = registry;
    this.path = path;
  }

  async checkAll(): Promise<ProviderHealth[]> {
    const results: ProviderHealth[] = [];
    for (const provider of this.registry.list()) {
      try {
        results.push(await provider.health());
      } catch (error) {
        results.push({
          provider_id: provider.id,
          available: false,
          configured: false,
          latency_ms: 0,
          error_rate: 1,
          last_checked_at: new Date().toISOString(),
          reason: error instanceof Error ? error.message : "Health check failed."
        });
      }
    }
    await this.write(results);
    return results;
  }

  async latest(): Promise<ProviderHealth[]> {
    try {
      const parsed = JSON.parse(await readFile(this.path, "utf8")) as ProviderHealth[];
      return Array.isArray(parsed) && parsed.length ? parsed : this.checkAll();
    } catch {
      return this.checkAll();
    }
  }

  private async write(results: ProviderHealth[]): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, `${JSON.stringify(results, null, 2)}\n`);
  }
}
