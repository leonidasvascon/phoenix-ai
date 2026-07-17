import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const document = JSON.parse(await readFile(resolve(process.cwd(), "docs", "openapi", "phoenix-api.json"), "utf8"));
const requiredPaths = ["/tasks", "/tasks/batch", "/executions", "/executions/{id}", "/analytics", "/learning", "/feedback", "/strategy", "/brands", "/publications", "/providers", "/scheduled-jobs", "/quality", "/health", "/metrics"];
const missing = requiredPaths.filter((path) => !document.paths?.[path]);
if (document.openapi !== "3.1.0") throw new Error("OpenAPI version must be 3.1.0.");
if (missing.length > 0) throw new Error(`Missing OpenAPI paths: ${missing.join(", ")}`);
if (JSON.stringify(document).match(/sk-proj|OPENAI_API_KEY|META_ACCESS_TOKEN|PHOENIX_API_KEY=|Bearer [A-Za-z0-9._-]+/)) {
  throw new Error("OpenAPI document appears to contain a secret.");
}
console.log(JSON.stringify({ status: "valid", paths: Object.keys(document.paths).length }, null, 2));
