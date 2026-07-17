"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../api-client";

type Identity = { provider: string; subject: string };

export default function AccountIdentitiesPage() {
  const [identities, setIdentities] = useState<Identity[]>([]);

  useEffect(() => {
    void apiFetch("/auth/identities").then(async (response) => {
      if (response.ok) setIdentities(await response.json() as Identity[]);
    });
  }, []);

  return (
    <main className="studio-page">
      <header className="page-header"><div><p>Phoenix Identity</p><h1>Identidades</h1></div></header>
      <section className="grid-list">
        {identities.map((identity) => (
          <article className="card" key={`${identity.provider}:${identity.subject}`}>
            <h2>{identity.provider}</h2>
            <p>{identity.subject}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
