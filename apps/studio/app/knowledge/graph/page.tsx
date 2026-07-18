"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api-client";

type Node = { id: string; type: string; label: string };
type Edge = { id: string; from: string; to: string; type: string };
type Graph = { nodes: Node[]; edges: Edge[] };

export default function KnowledgeGraphViewPage() {
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [type, setType] = useState("");

  async function loadGraph() {
    const response = await apiFetch("/knowledge/graph");
    if (response.ok) setGraph(await response.json() as Graph);
  }

  useEffect(() => {
    void loadGraph();
  }, []);

  const nodes = useMemo(() => type ? graph.nodes.filter((node) => node.type === type) : graph.nodes, [graph.nodes, type]);
  const types = Array.from(new Set(graph.nodes.map((node) => node.type))).sort();

  return (
    <main className="studio-page">
      <header className="page-header">
        <div>
          <p>Knowledge Graph</p>
          <h1>Grafo</h1>
        </div>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">Todos</option>
          {types.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </header>

      <section className="dashboard-grid">
        <section className="panel">
          <h2>Entidades</h2>
          {nodes.map((node) => (
            <article className="compact-card" key={node.id}>
              <strong>{node.label}</strong>
              <p>{node.type}</p>
            </article>
          ))}
        </section>
        <section className="panel">
          <h2>Conexoes</h2>
          {graph.edges.slice(0, 80).map((edge) => (
            <article className="compact-card" key={edge.id}>
              <strong>{edge.type}</strong>
              <p>{edge.from} {"->"} {edge.to}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
