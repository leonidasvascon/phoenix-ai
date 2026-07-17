"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../api-client";

type Session = { id: string; created_at: string; expires_at: string; last_seen_at: string; revoked_at: string | null; user_agent_summary: string };

export default function AccountSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  async function load() {
    const response = await apiFetch("/auth/sessions");
    if (response.ok) setSessions(await response.json() as Session[]);
  }

  useEffect(() => { void load(); }, []);

  async function revoke(id: string) {
    await apiFetch(`/auth/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  return (
    <main className="studio-page">
      <header className="page-header"><div><p>Phoenix Identity</p><h1>Sessoes</h1></div></header>
      <section className="grid-list">
        {sessions.map((session) => (
          <article className="card" key={session.id}>
            <h2>{session.user_agent_summary || "Sessao"}</h2>
            <p>Ultimo uso: {session.last_seen_at}</p>
            <p>Expira: {session.expires_at}</p>
            <button type="button" onClick={() => revoke(session.id)}>Revogar</button>
          </article>
        ))}
      </section>
    </main>
  );
}
