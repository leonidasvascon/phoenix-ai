"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../api-client";

type KnowledgeGraph = {
  summary: {
    entities: number;
    relations: number;
    embeddings: number;
    provenance: number;
  };
};

export default function KnowledgePage() {
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [message, setMessage] = useState("");

  async function loadGraph() {
    const response = await apiFetch("/knowledge/graph");
    if (response.ok) setGraph(await response.json() as KnowledgeGraph);
  }

  async function ingest() {
    const response = await apiFetch("/knowledge/ingest", {
      method: "POST",
      body: JSON.stringify({})
    });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? `Ingestao concluida: ${payload.entities} entidades.` : payload.error?.message ?? "Falha na ingestao.");
    await loadGraph();
  }

  useEffect(() => {
    void loadGraph();
  }, []);

  return (
    <main className="studio-page">
      <header className="page-header">
        <div>
          <p>Knowledge Intelligence</p>
          <h1>Knowledge Graph</h1>
        </div>
        <div className="button-row">
          <button type="button" onClick={() => void ingest()}>Ingerir conhecimento</button>
          <Link className="button-link" href="/knowledge/search">Buscar</Link>
        </div>
      </header>

      {message && <p className="status-message">{message}</p>}

      <section className="metric-grid">
        <article className="metric-card"><span>Entidades</span><strong>{graph?.summary.entities ?? 0}</strong></article>
        <article className="metric-card"><span>Relacoes</span><strong>{graph?.summary.relations ?? 0}</strong></article>
        <article className="metric-card"><span>Embeddings</span><strong>{graph?.summary.embeddings ?? 0}</strong></article>
        <article className="metric-card"><span>Proveniencia</span><strong>{graph?.summary.provenance ?? 0}</strong></article>
      </section>

      <section className="panel">
        <h2>Explorar</h2>
        <div className="button-row">
          <Link className="button-link" href="/knowledge/entities">Entidades</Link>
          <Link className="button-link" href="/knowledge/graph">Grafo</Link>
          <Link className="button-link" href="/knowledge/search">RAG Search</Link>
        </div>
      </section>
    </main>
  );
}
