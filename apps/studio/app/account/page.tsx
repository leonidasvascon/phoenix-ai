"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../api-client";

type MeResponse = { user: { id: string; name: string; email: string; status: string; email_verified: boolean } };

export default function AccountPage() {
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    void apiFetch("/auth/me").then(async (response) => {
      if (response.ok) setMe(await response.json() as MeResponse);
    });
  }, []);

  return (
    <main className="studio-page">
      <header className="page-header">
        <div>
          <p>Phoenix Identity</p>
          <h1>Conta</h1>
        </div>
      </header>
      <section className="panel">
        {me ? (
          <>
            <h2>{me.user.name}</h2>
            <p>{me.user.email}</p>
            <p>Status: {me.user.status}</p>
            <p>Email verificado: {me.user.email_verified ? "sim" : "nao"}</p>
          </>
        ) : <p>Sessao de usuario nao encontrada. O acesso pode estar usando chave de servico.</p>}
        <div className="button-row">
          <Link className="button-secondary" href="/account/security">Seguranca</Link>
          <Link className="button-secondary" href="/account/sessions">Sessoes</Link>
          <Link className="button-secondary" href="/account/identities">Identidades</Link>
        </div>
      </section>
    </main>
  );
}
