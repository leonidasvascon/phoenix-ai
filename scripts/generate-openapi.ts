import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openApiDocument } from "../apps/api/src/openapi/openapi-document.ts";
import { toYaml } from "../apps/api/src/openapi/yaml.ts";

const directory = resolve(process.cwd(), "docs", "openapi");
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, "phoenix-api.json"), `${JSON.stringify(openApiDocument, null, 2)}\n`, "utf8");
await writeFile(resolve(directory, "phoenix-api.yaml"), toYaml(openApiDocument), "utf8");
console.log(JSON.stringify({ status: "generated", files: ["docs/openapi/phoenix-api.json", "docs/openapi/phoenix-api.yaml"] }, null, 2));
