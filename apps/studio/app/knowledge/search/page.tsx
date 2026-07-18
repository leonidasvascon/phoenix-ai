"use client";

import { useState } from "react";
import { apiFetch } from "../../api-client";

type SearchResult = {
  id: string;
  document_id: string;
  source: string;
  chunk: string;
  score: number;
  created_at: string;
  entity?: { id: string; type: string; label: string };
};

type SearchResponse = {
  results: SearchResult[];
  metrics: Record<string, number>;
};

export default function KnowledgeSearchPage() {
  const [query, setQuery] = useState("saudade Encanto Intenso");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [message, setMessage] = useState("");

  async function search() {
    const response = await apiFetch(`/knowledge/search?q=${encodeURIComponent(query)}`);
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      setResult(payload as SearchResponse);
      setMessage("");
      return;
    }
    setMessage(payload.error?.message ?? "Falha na busca.");
  }

  return (
    <main className="studio-page">
      <header className="page-header">
        <div>
          <p>Advanced RAG</p>
          <h1>Busca hibrida</h1>
        </div>
        <button type="button" onClick={() => void search()}>Buscar</button>
      </header>

      <section className="panel">
        <label>
          Pergunta
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </section>

      {message && <p className="status-message">{message}</p>}
      {result && (
        <section className="dashboard-grid">
          <section className="panel">
            <h2>Resultados</h2>
            {result.results.length === 0 && <p>Nenhum contexto encontrado.</p>}
            {result.results.map((item) => (
              <article className="compact-card" key={item.id}>
                <strong>{item.entity?.label ?? item.document_id}</strong>
                <p>{item.entity?.type ?? "Document"} | score {item.score}</p>
                <p>{item.source}</p>
                <pre className="code-block">{item.chunk}</pre>
              </article>
            ))}
          </section>
          <aside className="panel">
            <h2>Metricas</h2>
            <pre className="code-block">{JSON.stringify(result.metrics, null, 2)}</pre>
          </aside>
        </section>
      )}
    </main>
  );
}
