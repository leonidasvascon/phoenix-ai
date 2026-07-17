import { defaultWorkspaceId } from "@phoenix-ai/workspace";

const mappings = [
  ["OPENAI_API_KEY", "OPENAI_API_KEY_REF", `env://OPENAI_API_KEY`],
  ["META_ACCESS_TOKEN", "META_ACCESS_TOKEN_REF", `env://META_ACCESS_TOKEN`],
  ["PHOENIX_API_KEY", "PHOENIX_API_KEY_REF", `env://PHOENIX_API_KEY`]
];

for (const [source, referenceEnv, reference] of mappings) {
  if (process.env[source] && !process.env[referenceEnv]) {
    console.log(`${referenceEnv}=${reference}`);
  }
}

console.log(`Default workspace secret reference examples:`);
console.log(`OPENAI_API_KEY_REF=secret://${defaultWorkspaceId}/openai/api-key`);
console.log(`META_ACCESS_TOKEN_REF=secret://${defaultWorkspaceId}/meta/access-token`);
console.log("Migration does not copy values into the vault automatically.");
