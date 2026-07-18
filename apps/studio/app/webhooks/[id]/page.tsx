"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../api-client";

type Props = { params: Promise<{ id: string }> };
type WebhookDetails = {
  id: string;
  url: string;
  events: string[];
  status: "active" | "disabled";
  has_secret: boolean;
  deliveries: Array<{ id: string; event_type: string; status: string; response_status?: number; error?: string; updated_at: string }>;
};

export default function WebhookDetailsPage({ params }: Props) {
  const [id, setId] = useState("");
  const [webhook, setWebhook] = useState<WebhookDetails | null>(null);
  const [message, setMessage] = useState("");

  async function loadWebhook(webhookId: string) {
    const response = await apiFetch(`/webhooks/${webhookId}`);
    if (response.ok) setWebhook(await response.json() as WebhookDetails);
  }

  async function testWebhook() {
    if (!id) return;
    const response = await apiFetch(`/webhooks/${id}/test`, { method: "POST" });
    setMessage(response.ok ? "Teste enviado." : "Falha no teste.");
    await loadWebhook(id);
  }

  useEffect(() => {
    params.then((value) => {
      setId(value.id);
      void loadWebhook(value.id);
    });
  }, [params]);

  return (
    <main className="studio-page">
      <header className="page-header">
        <div>
          <p>Webhook</p>
          <h1>{webhook?.url ?? id}</h1>
        </div>
        <button type="button" onClick={() => void testWebhook()}>Enviar teste</button>
      </header>

      {message && <p className="status-message">{message}</p>}
      {!webhook && <section className="panel"><p>Webhook nao encontrado.</p></section>}
      {webhook && (
        <section className="dashboard-grid">
          <section className="panel">
            <h2>Configuracao</h2>
            <p><strong>Status:</strong> {webhook.status}</p>
            <p><strong>Eventos:</strong> {webhook.events.join(", ")}</p>
            <p><strong>HMAC:</strong> {webhook.has_secret ? "ativo" : "sem segredo"}</p>
          </section>
          <section className="panel">
            <h2>Entregas</h2>
            {webhook.deliveries.length === 0 && <p>Nenhuma entrega registrada.</p>}
            {webhook.deliveries.map((delivery) => (
              <article className="compact-card" key={delivery.id}>
                <strong>{delivery.event_type}</strong>
                <p>{delivery.status} {delivery.response_status ? `HTTP ${delivery.response_status}` : ""}</p>
                {delivery.error && <p className="error-text">{delivery.error}</p>}
              </article>
            ))}
          </section>
        </section>
      )}
    </main>
  );
}
