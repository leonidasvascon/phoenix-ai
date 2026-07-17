export function SecretProviderStatus({ provider }: Readonly<{ provider: { name: string; configured: boolean; healthy: boolean; readOnly: boolean; reason?: string } }>) {
  return (
    <article className="card">
      <h2>{provider.name}</h2>
      <p>Configurado: {provider.configured ? "sim" : "nao"}</p>
      <p>Saude: {provider.healthy ? "ok" : "falha"}</p>
      <p>Somente leitura: {provider.readOnly ? "sim" : "nao"}</p>
      {provider.reason ? <p>{provider.reason}</p> : null}
    </article>
  );
}
