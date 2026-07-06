"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import type { BrandDna } from "../../../components/brand-card";
import { Navigation } from "../../../components/navigation";
import { QueryProvider } from "../../query-provider";

const apiUrl = process.env.NEXT_PUBLIC_PHOENIX_API_URL ?? "http://127.0.0.1:4000";

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function formatValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Sim" : "Nao";
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);

  return String(value);
}

function KeyValueSection({ title, values }: Readonly<{ title: string; values?: Record<string, unknown> }>) {
  const entries = Object.entries(values ?? {});

  return (
    <section className="brand-dna-section">
      <h2>{title}</h2>
      {entries.length > 0 ? (
        <dl>
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt>{formatLabel(key)}</dt>
              <dd>{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="muted">Nao informado.</p>
      )}
    </section>
  );
}

function ListSection({ title, values }: Readonly<{ title: string; values?: string[] }>) {
  return (
    <section className="brand-dna-section">
      <h2>{title}</h2>
      {values && values.length > 0 ? (
        <ul>
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">Nao informado.</p>
      )}
    </section>
  );
}

function BrandDetail({ brand }: Readonly<{ brand: BrandDna }>) {
  return (
    <section className="brand-detail">
      <header>
        <div>
          <p>{brand.brand.id}</p>
          <h2>{brand.brand.name}</h2>
        </div>
        <span>v{brand.version}</span>
      </header>

      <section className="brand-purpose">
        <h2>Proposito</h2>
        <p>{brand.purpose ?? "Nao informado."}</p>
      </section>

      <div className="brand-dna-grid">
        <KeyValueSection title="Personalidade" values={brand.personality} />
        <KeyValueSection title="Tom de voz" values={brand.tone} />
        <KeyValueSection title="Visual" values={brand.visual} />
        <KeyValueSection title="Preferencias de escrita" values={brand.writing} />
        <KeyValueSection title="Metricas de sucesso" values={brand.success_metrics} />
        <KeyValueSection title="Conteudo" values={brand.content} />
        <ListSection title="Emocoes" values={brand.emotions} />
        <ListSection title="Padroes proibidos" values={brand.avoid} />
        <ListSection title="Hooks preferidos" values={brand.preferred_hooks} />
        <ListSection title="Storytelling preferido" values={brand.preferred_storytelling} />
        <ListSection title="Emocoes preferidas" values={brand.preferred_emotions} />
        <ListSection title="Padroes proibidos do Runtime" values={brand.forbidden_patterns} />
      </div>

      <section className="brand-json">
        <h2>Brand DNA completo</h2>
        <pre>{JSON.stringify(brand, null, 2)}</pre>
      </section>
    </section>
  );
}

function BrandDetailView() {
  const params = useParams<{ id: string }>();
  const brandId = params.id;
  const brand = useQuery({
    enabled: Boolean(brandId),
    queryKey: ["brand", brandId],
    queryFn: async (): Promise<BrandDna> => {
      const response = await fetch(`${apiUrl}/brands/${brandId}`);

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar o Brand DNA.");
      }

      return response.json();
    }
  });

  return (
    <main className="brands-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Brand DNA</h1>
      </section>

      {brand.isLoading ? <p className="muted">Carregando Brand DNA...</p> : null}
      {brand.error ? <p className="error">{brand.error.message}</p> : null}
      {brand.data ? <BrandDetail brand={brand.data} /> : null}
    </main>
  );
}

export default function BrandDetailPage() {
  return (
    <QueryProvider>
      <BrandDetailView />
    </QueryProvider>
  );
}
