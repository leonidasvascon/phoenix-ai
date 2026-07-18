"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../api-client";

type PhoenixEvent = {
  event_id: string;
  type: string;
  trace_id?: string;
  workspace_id: string;
  timestamp: string;
  origin: string;
  payload: Record<string, unknown>;
};

export default function EventsPage() {
  const [events, setEvents] = useState<PhoenixEvent[]>([]);
  const [selected, setSelected] = useState<PhoenixEvent | null>(null);

  async function loadEvents() {
    const response = await apiFetch("/events");
    if (response.ok) {
      const items = await response.json() as PhoenixEvent[];
      setEvents(items);
      if (!selected && items[0]) setSelected(items[0]);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, []);

  return (
    <main className="studio-page">
      <header className="page-header">
        <div>
          <p>Event Bus</p>
          <h1>Eventos</h1>
        </div>
        <div className="button-row">
          <Link className="button-link" href="/events/dlq">Dead Letter Queue</Link>
          <Link className="button-link" href="/webhooks">Webhooks</Link>
        </div>
      </header>

      <section className="dashboard-grid">
        <aside className="panel">
          <h2>Historico</h2>
          {events.length === 0 && <p>Nenhum evento registrado.</p>}
          {events.map((event) => (
            <button className="list-button" key={event.event_id} type="button" onClick={() => setSelected(event)}>
              <strong>{event.type}</strong>
              <span>{new Date(event.timestamp).toLocaleString("pt-BR")}</span>
            </button>
          ))}
        </aside>

        <section className="panel">
          <h2>{selected?.type ?? "Payload"}</h2>
          {!selected && <p>Selecione um evento para ver o payload sanitizado.</p>}
          {selected && (
            <div className="stacked-content">
              <p><strong>Trace:</strong> {selected.trace_id ?? "sem trace"}</p>
              <p><strong>Workspace:</strong> {selected.workspace_id}</p>
              <p><strong>Origem:</strong> {selected.origin}</p>
              <pre className="code-block">{JSON.stringify(selected.payload, null, 2)}</pre>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
