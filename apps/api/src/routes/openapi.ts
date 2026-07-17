import type { IncomingMessage, ServerResponse } from "node:http";
import { openApiDocument } from "../openapi/openapi-document.ts";
import { toYaml } from "../openapi/yaml.ts";

export async function handleOpenApiRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (request.method !== "GET") {
    response.writeHead(405, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed.", status: 405 } }));
    return;
  }

  if (url.pathname === "/openapi.json") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(openApiDocument, null, 2));
    return;
  }

  if (url.pathname === "/openapi.yaml") {
    response.writeHead(200, { "Content-Type": "application/yaml" });
    response.end(toYaml(openApiDocument));
    return;
  }

  if (url.pathname === "/docs") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(renderDocsHtml());
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ error: { code: "NOT_FOUND", message: "Route not found.", status: 404 } }));
}

function renderDocsHtml(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Phoenix API Docs</title>
  <style>
    body { margin: 0; background: #f4f2ed; color: #151515; font-family: Arial, sans-serif; }
    main { width: min(1100px, calc(100vw - 40px)); margin: 40px auto; display: grid; gap: 18px; }
    section { border: 1px solid #d8d2c7; border-radius: 8px; background: white; padding: 18px; }
    code, pre { background: #fffdfa; border: 1px solid #d8d2c7; border-radius: 6px; padding: 10px; overflow: auto; }
    a { color: #7d1e1e; }
  </style>
</head>
<body>
  <main>
    <header><p>Phoenix AI</p><h1>Phoenix API Docs</h1></header>
    <section><h2>OpenAPI</h2><p><a href="/openapi.json">JSON</a> | <a href="/openapi.yaml">YAML</a></p></section>
    <section><h2>Autenticacao</h2><pre>Authorization: Bearer &lt;token&gt;\nX-Phoenix-Api-Key: &lt;api-key&gt;</pre><p>Esta pagina nunca exibe chaves, tokens ou valores reais de ambiente.</p></section>
    <section><h2>Exemplo</h2><pre>curl -X POST http://127.0.0.1:4000/tasks \\\n  -H "X-Phoenix-Api-Key: $PHOENIX_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"brand":"encanto-intenso","theme":"saudade","objective":"viralizar","platform":"instagram","format":"reel"}'</pre></section>
  </main>
</body>
</html>`;
}
