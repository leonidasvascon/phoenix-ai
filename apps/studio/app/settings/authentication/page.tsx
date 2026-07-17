"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../api-client";

type Provider = { id: string; configured: boolean; ready: boolean; issuer?: string; redirect_uri?: string };

export default function AuthenticationSettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    void apiFetch("/auth/providers").then(async (response) => {
      if (response.ok) setProviders(await response.json() as Provider[]);
    });
  }, []);

  return (
    <main className="studio-page">
      <header className="page-header"><div><p>Phoenix Identity</p><h1>Autenticacao</h1></div></header>
      <section className="grid-list">
        {providers.map((provider) => (
          <article className="card" key={provider.id}>
            <h2>{provider.id}</h2>
            <p>Configurado: {provider.configured ? "sim" : "nao"}</p>
            <p>Pronto: {provider.ready ? "sim" : "nao"}</p>
            {provider.issuer ? <p>Issuer: {provider.issuer}</p> : null}
          </article>
        ))}
      </section>
    </main>
  );
}
