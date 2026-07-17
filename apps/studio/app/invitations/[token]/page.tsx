"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "../../api-client";

type Invitation = { workspace_id: string; invitation: { email: string; role: string; status: string; expires_at?: string } };

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void apiFetch(`/invitations/${encodeURIComponent(token)}`).then(async (response) => {
      if (response.ok) setInvitation(await response.json() as Invitation);
    });
  }, [token]);

  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await apiFetch(`/invitations/${encodeURIComponent(token)}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password })
    });
    if (response.ok) router.replace("/login");
    else setStatus("Nao foi possivel aceitar o convite.");
  }

  async function reject() {
    const response = await apiFetch(`/invitations/${encodeURIComponent(token)}/reject`, { method: "POST" });
    setStatus(response.ok ? "Convite recusado." : "Nao foi possivel recusar.");
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <header><p>Phoenix Studio</p><h1>Convite</h1></header>
        {invitation ? (
          <form onSubmit={accept}>
            <p>{invitation.invitation.email} foi convidado como {invitation.invitation.role}.</p>
            <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
            <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <button type="submit">Aceitar convite</button>
            <button type="button" onClick={reject}>Recusar</button>
          </form>
        ) : <p>Convite nao encontrado ou expirado.</p>}
        {status ? <p>{status}</p> : null}
      </section>
    </main>
  );
}
