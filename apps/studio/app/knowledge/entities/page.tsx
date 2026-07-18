"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../api-client";

type Entity = {
  id: string;
  type: string;
  label: string;
  workspace_id: string;
  metadata: Record<string, unknown>;
};

export default function KnowledgeEntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filter, setFilter] = useState("");

  async function loadEntities() {
    const response = await apiFetch("/knowledge/entities");
    if (response.ok) setEntities(await response.json() as Entity[]);
  }

  useEffect(() => {
    void loadEntities();
  }, []);

  const visible = entities.filter((entity) => `${entity.type} ${entity.label}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <main className="studio-page">
      <header className="page-header">
        <div>
          <p>Knowledge Graph</p>
          <h1>Entidades</h1>
        </div>
      </header>

      <section className="panel">
        <label>
          Filtro
          <input value={filter} onChange={(event) => setFilter(event.target.value)} />
        </label>
      </section>

      <section className="dashboard-grid">
        {visible.map((entity) => (
          <article className="compact-card" key={entity.id}>
            <strong>{entity.label}</strong>
            <p>{entity.type} | {entity.workspace_id}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
