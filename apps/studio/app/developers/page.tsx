"use client";

import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type Health = { status: string };
type OpenApiInfo = { info?: { title?: string; version?: string }; openapi?: string };

function DevelopersView() {
  const health = useQuery({ queryKey: ["developer-health"], queryFn: async (): Promise<Health> => (await apiFetch("/health/live")).json() });
  const openapi = useQuery({ queryKey: ["developer-openapi"], queryFn: async (): Promise<OpenApiInfo> => (await fetch(`${process.env.NEXT_PUBLIC_PHOENIX_API_URL ?? "http://127.0.0.1:4000"}/openapi.json`)).json() });
  const apiUrl = process.env.NEXT_PUBLIC_PHOENIX_API_URL ?? "http://127.0.0.1:4000";

  return (
    <main className="developers-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Desenvolvedores</h1>
      </section>

      <section className="developers-grid">
        <article className="developers-card">
          <h2>API</h2>
          <dl>
            <div><dt>URL</dt><dd>{apiUrl}</dd></div>
            <div><dt>Status</dt><dd>{health.data?.status ?? "carregando"}</dd></div>
            <div><dt>OpenAPI</dt><dd>{openapi.data?.openapi ?? "3.1.0"}</dd></div>
            <div><dt>Versao</dt><dd>{openapi.data?.info?.version ?? "0.2.0"}</dd></div>
          </dl>
        </article>
        <article className="developers-card">
          <h2>Documentacao</h2>
          <a href={`${apiUrl}/docs`} rel="noreferrer" target="_blank">Abrir Docs</a>
          <a href={`${apiUrl}/openapi.json`} rel="noreferrer" target="_blank">OpenAPI JSON</a>
          <a href={`${apiUrl}/openapi.yaml`} rel="noreferrer" target="_blank">OpenAPI YAML</a>
        </article>
      </section>

      <section className="developers-card">
        <h2>Autenticacao</h2>
        <pre>{`Authorization: Bearer <token>\nX-Phoenix-Api-Key: <api-key>`}</pre>
        <p className="muted">A chave usada na sessao nao e exibida nesta tela.</p>
      </section>

      <section className="developers-card">
        <h2>SDK TypeScript</h2>
        <pre>{`import { PhoenixClient } from "@phoenix-ai/sdk";

const phoenix = new PhoenixClient({
  baseUrl: "${apiUrl}",
  apiKey: process.env.PHOENIX_API_KEY
});

const result = await phoenix.tasks.create({
  brand: "encanto-intenso",
  theme: "saudade",
  objective: "viralizar",
  platform: "instagram",
  format: "reel"
});`}</pre>
      </section>
    </main>
  );
}

export default function DevelopersPage() {
  return <QueryProvider><DevelopersView /></QueryProvider>;
}
