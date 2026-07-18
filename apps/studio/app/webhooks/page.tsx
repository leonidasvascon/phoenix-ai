"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../api-client";

type Webhook = {
  id: string;
  url: string;
  events: string[];
  status: "active" | "disabled";
  retries: number;
  timeout_ms: number;
  has_secret: boolean;
  deliveries?: Array<{ id: string; status: string; event_type: string; updated_at: string }>;
};

const defaultEvents = "task.completed\nworkflow.completed\npublication.completed";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState(defaultEvents);
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");

  async function loadWebhooks() {
    const response = await apiFetch("/webhooks");
    if (response.ok) setWebhooks(await response.json() as Webhook[]);
  }

  async function createWebhook() {
    const response = await apiFetch("/webhooks", {
      method: "POST",
      body: JSON.stringify({
        url,
        events: events.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
        secret: secret || undefined
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      setMessage("Webhook criado.");
      setUrl("");
      setSecret("");
      await loadWebhooks();
      return;
    }
    setMessage(payload.error?.message ?? "Falha ao criar webhook.");
  }

  async function removeWebhook(id: string) {
    const response = await apiFetch(`/webhooks/${id}`, { method: "DELETE" });
    setMessage(response.ok ? "Webhook removido." : "Falha ao remover webhook.");
    await loadWebhooks();
  }

  useEffect(() => {
    void loadWebhooks();
  }, []);

  return (
    <main className="studio-page">
      <header className="page-header">
        <div>
          <p>Event Bus</p>
          <h1>Webhooks</h1>
        </div>
      </header>

      {message && <p className="status-message">{message}</p>}

      <section className="dashboard-grid">
        <section className="panel">
          <h2>Novo destino</h2>
          <label>
            URL HTTPS
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://cliente.com/webhook" />
          </label>
          <label>
            Eventos
            <textarea value={events} onChange={(event) => setEvents(event.target.value)} rows={5} />
          </label>
          <label>
            Segredo HMAC
            <input value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="opcional" />
          </label>
          <button type="button" onClick={() => void createWebhook()}>Criar webhook</button>
        </section>

        <section className="panel">
          <h2>Destinos</h2>
          {webhooks.length === 0 && <p>Nenhum webhook configurado.</p>}
          {webhooks.map((webhook) => (
            <article className="compact-card" key={webhook.id}>
              <strong>{webhook.url}</strong>
              <p>{webhook.status} | {webhook.events.join(", ")}</p>
              <p>{webhook.has_secret ? "Assinado" : "Sem segredo"} | timeout {webhook.timeout_ms}ms</p>
              <div className="button-row">
                <Link className="button-link" href={`/webhooks/${webhook.id}`}>Ver entregas</Link>
                <button type="button" onClick={() => void removeWebhook(webhook.id)}>Remover</button>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
