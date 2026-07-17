import Link from "next/link";

export type SecretMetadataView = {
  id: string;
  name: string;
  namespace: string;
  provider: string;
  reference: string;
  status: string;
  version: number;
  updatedAt: string;
  expiresAt?: string;
};

export function SecretMetadataCard({ secret }: Readonly<{ secret: SecretMetadataView }>) {
  return (
    <article className="card">
      <h2>{secret.name}</h2>
      <p>{secret.namespace} / {secret.provider}</p>
      <p>Status: {secret.status}</p>
      <p>Versao: {secret.version}</p>
      <p>Referencia: {secret.reference}</p>
      {secret.expiresAt ? <p>Expira: {secret.expiresAt}</p> : null}
      <Link className="button-secondary" href={`/settings/secrets/${secret.id}`}>Ver detalhes</Link>
    </article>
  );
}
