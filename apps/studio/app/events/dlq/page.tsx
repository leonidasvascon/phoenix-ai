"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../api-client";

type DlqItem = {
  id: string;
  event_id: string;
  event_type: string;
  webhook_id: string;
  url: string;
  reason: string;
  attempts: number;
  updated_at: string;
};

export default function DeadLetterQueuePage() {
  const [items, setItems] = useState<DlqItem[]>([]);
  const [message, setMessage] = useState("");

  async function loadItems() {
    const response = await apiFetch("/dlq");
    if (response.ok) setItems(await response.json() as DlqItem[]);
  }

  async function retry(itemId: string) {
    const response = await apiFetch(`/dlq/${itemId}/retry`, { method: "POST" });
    setMessage(response.ok ? "Entrega reenfileirada." : "Falha ao reprocessar.");
    await loadItems();
  }

  useEffect(() => {
    void loadItems();
  }, []);

  return (
    <main className="studio-page">
      <header className="page-header">
        <div>
          <p>Event Bus</p>
          <h1>Dead Letter Queue</h1>
        </div>
      </header>

      {message && <p className="status-message">{message}</p>}
      <section className="panel">
        {items.length === 0 && <p>Nenhuma entrega em falha definitiva.</p>}
        {items.map((item) => (
          <article className="compact-card" key={item.id}>
            <strong>{item.event_type}</strong>
            <p>{item.reason}</p>
            <p>{item.url}</p>
            <button type="button" onClick={() => void retry(item.id)}>Reprocessar</button>
          </article>
        ))}
      </section>
    </main>
  );
}
