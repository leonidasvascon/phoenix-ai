import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { StrategyService, type StrategyPlan } from "@phoenix-ai/strategy-engine";
import { getLearningReport } from "./learning-service.ts";

const strategyPath = resolve(process.cwd(), ".storage", "strategy", "latest.json");
const strategyService = new StrategyService();

export async function getLatestStrategyPlan(): Promise<StrategyPlan | null> {
  try {
    return JSON.parse(await readFile(strategyPath, "utf8")) as StrategyPlan;
  } catch {
    return null;
  }
}

export async function generateStrategyPlan(input: unknown): Promise<StrategyPlan> {
  const learning = await getLearningReport();
  const plan = strategyService.generate(normalizeStrategyInput(input), {
    learning
  });

  await mkdir(resolve(process.cwd(), ".storage", "strategy"), { recursive: true });
  await writeFile(strategyPath, JSON.stringify(plan, null, 2), "utf8");

  return plan;
}

function normalizeStrategyInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") {
    return {};
  }

  return input as Record<string, unknown>;
}
