"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { type FormEvent, useState } from "react";
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

function arrayToText(values?: string[]): string {
  return values?.join("\n") ?? "";
}

function textToArray(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toneToText(values?: Record<string, unknown>): string {
  return Object.entries(values ?? {})
    .map(([key, value]) => `${key}=${formatValue(value).toLowerCase()}`)
    .join("\n");
}

function parseEditableScalar(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === "true" || trimmed === "sim") return true;
  if (trimmed === "false" || trimmed === "nao") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  return trimmed;
}

function textToKeyValue(value: string): Record<string, unknown> {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, unknown>>((result, line) => {
      const separator = line.includes("=") ? "=" : ":";
      const [key, ...rawValue] = line.split(separator);

      if (key?.trim() && rawValue.length > 0) {
        result[key.trim()] = parseEditableScalar(rawValue.join(separator));
      }

      return result;
    }, {});
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

function BrandEditor({
  brand,
  isSaving,
  onCancel,
  onSave
}: Readonly<{
  brand: BrandDna;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (brand: BrandDna) => void;
}>) {
  const [purpose, setPurpose] = useState(brand.purpose ?? "");
  const [tone, setTone] = useState(toneToText(brand.tone));
  const [emotions, setEmotions] = useState(arrayToText(brand.emotions));
  const [preferredHooks, setPreferredHooks] = useState(arrayToText(brand.preferred_hooks));
  const [preferredStorytelling, setPreferredStorytelling] = useState(arrayToText(brand.preferred_storytelling));
  const [preferredCta, setPreferredCta] = useState(brand.preferred_cta ?? "");
  const [forbiddenPatterns, setForbiddenPatterns] = useState(arrayToText(brand.avoid));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const forbidden = textToArray(forbiddenPatterns);

    onSave({
      ...brand,
      purpose,
      tone: textToKeyValue(tone),
      emotions: textToArray(emotions),
      preferred_hooks: textToArray(preferredHooks),
      preferred_storytelling: textToArray(preferredStorytelling),
      preferred_cta: preferredCta,
      avoid: forbidden,
      forbidden_patterns: forbidden
    });
  }

  return (
    <form className="brand-editor" onSubmit={handleSubmit}>
      <label>
        Proposito
        <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} rows={4} />
      </label>

      <label>
        Tom
        <textarea value={tone} onChange={(event) => setTone(event.target.value)} rows={6} />
      </label>

      <label>
        Emocoes
        <textarea value={emotions} onChange={(event) => setEmotions(event.target.value)} rows={5} />
      </label>

      <label>
        Hooks preferidos
        <textarea value={preferredHooks} onChange={(event) => setPreferredHooks(event.target.value)} rows={4} />
      </label>

      <label>
        Storytelling preferido
        <textarea value={preferredStorytelling} onChange={(event) => setPreferredStorytelling(event.target.value)} rows={4} />
      </label>

      <label>
        CTA preferido
        <input value={preferredCta} onChange={(event) => setPreferredCta(event.target.value)} />
      </label>

      <label>
        Padroes proibidos
        <textarea value={forbiddenPatterns} onChange={(event) => setForbiddenPatterns(event.target.value)} rows={5} />
      </label>

      <div className="brand-editor-actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar alteracoes"}
        </button>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function BrandDetail({
  brand,
  isSaving,
  onSave
}: Readonly<{
  brand: BrandDna;
  isSaving: boolean;
  onSave: (brand: BrandDna) => void;
}>) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <section className="brand-detail">
      <header>
        <div>
          <p>{brand.brand.id}</p>
          <h2>{brand.brand.name}</h2>
        </div>
        <div className="brand-detail-actions">
          <span>v{brand.version}</span>
          <button type="button" onClick={() => setIsEditing((current) => !current)}>
            {isEditing ? "Ver DNA" : "Editar DNA"}
          </button>
        </div>
      </header>

      {isEditing ? (
        <BrandEditor brand={brand} isSaving={isSaving} onCancel={() => setIsEditing(false)} onSave={onSave} />
      ) : null}

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
  const queryClient = useQueryClient();
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
  const updateBrand = useMutation({
    mutationFn: async (input: BrandDna): Promise<BrandDna> => {
      const response = await fetch(`${apiUrl}/brands/${brandId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar o Brand DNA.");
      }

      return response.json();
    },
    onSuccess: (updatedBrand) => {
      queryClient.setQueryData(["brand", brandId], updatedBrand);
      queryClient.invalidateQueries({ queryKey: ["brands"] });
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
      {updateBrand.error ? <p className="error">{updateBrand.error.message}</p> : null}
      {updateBrand.isSuccess ? <p className="success">Brand DNA salvo com sucesso.</p> : null}
      {brand.data ? <BrandDetail brand={brand.data} isSaving={updateBrand.isPending} onSave={(input) => updateBrand.mutate(input)} /> : null}
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
