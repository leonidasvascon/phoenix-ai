import { sanitize } from "../packages/observability/src/index.ts";

const sanitized = sanitize({
  authorization: "Bearer very-secret",
  prompt: "full prompt",
  nested: {
    access_token: "meta-token",
    value: "sk-proj-secretkey"
  }
}) as Record<string, unknown>;
const source = JSON.stringify(sanitized);

if (source.includes("very-secret") || source.includes("full prompt") || source.includes("meta-token") || source.includes("sk-proj")) {
  console.error(source);
  throw new Error("Sanitization leaked sensitive content.");
}

console.log(JSON.stringify({
  status: "pass",
  sanitized
}, null, 2));
