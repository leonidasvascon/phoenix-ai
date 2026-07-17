"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../api-client";

type ApiKey = { id: string; key_prefix: string; scopes: string[]; status: string; created_at: string; last_used_at?: string };

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [revealed, setRevealed] = useState("");

  async function load() {
    const response = await apiFetch("/api-keys");
    if (response.ok) setKeys(await response.json() as ApiKey[]);
  }

  useEffect(() => { void load(); }, []);

  async function create() {
    const response = await apiFetch("/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scopes: ["*"] }) });
    if (response.ok) {
      const payload = await response.json() as { api_key: string };
      setRevealed(payload.api_key);
      await load();
    }
  }

  async function revoke(id: string) {
    await apiFetch(`/api-keys/${encodeURIComponent(id)}/revoke`, { method: "POST" });
    await load();
  }

  return (
    <main className="studio-page">
      <header className="page-header"><div><p>Security</p><h1>API Keys</h1></div><button type="button" onClick={create}>Criar API Key</button></header>
      {revealed ? <section className="panel"><h2>Copie agora</h2><p>Esta chave sera exibida apenas uma vez.</p><code>{revealed}</code></section> : null}
      <section className="grid-list">
        {keys.map((key) => (
          <article className="card" key={key.id}>
            <h2>{key.key_prefix}</h2>
            <p>Status: {key.status}</p>
            <p>Scopes: {key.scopes.join(", ")}</p>
            <button type="button" onClick={() => revoke(key.id)}>Revogar</button>
          </article>
        ))}
      </section>
    </main>
  );
}
