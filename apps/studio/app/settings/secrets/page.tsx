"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../api-client";
import { SecretMetadataCard, type SecretMetadataView } from "../../../components/secret-metadata-card";
import { SecretProviderStatus } from "../../../components/secret-provider-status";

export default function SecretsPage() {
  const [secrets, setSecrets] = useState<SecretMetadataView[]>([]);
  const [providers, setProviders] = useState<Array<{ name: string; configured: boolean; healthy: boolean; readOnly: boolean; reason?: string }>>([]);

  useEffect(() => {
    void apiFetch("/secrets").then(async (response) => { if (response.ok) setSecrets(await response.json() as SecretMetadataView[]); });
    void apiFetch("/secrets/providers").then(async (response) => { if (response.ok) setProviders(await response.json()); });
  }, []);

  return (
    <main className="studio-page">
      <header className="page-header">
        <div><p>Security</p><h1>Secrets</h1></div>
        <Link className="button-primary" href="/settings/secrets/new">Novo segredo</Link>
      </header>
      <section className="grid-list">{providers.map((provider) => <SecretProviderStatus key={provider.name} provider={provider} />)}</section>
      <section className="grid-list">{secrets.map((secret) => <SecretMetadataCard key={secret.id} secret={secret} />)}</section>
    </main>
  );
}
