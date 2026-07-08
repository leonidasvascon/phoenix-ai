"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { BrandDna } from "../../../components/brand-card";
import { Navigation } from "../../../components/navigation";
import { QueryProvider } from "../../query-provider";
import { apiFetch } from "../../api-client";

type BrandCreateInput = {
  name: string;
  purpose: string;
  tone: Record<string, unknown>;
  emotions: string[];
  preferred_hooks: string[];
  preferred_storytelling: string[];
  preferred_cta: string;
  avoid: string[];
  forbidden_patterns: string[];
};

function parseEditableScalar(value: string): unknown {
  const trimmed = value.trim().toLowerCase();

  if (trimmed === "true" || trimmed === "sim") return true;
  if (trimmed === "false" || trimmed === "nao") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  return value.trim();
}

function textToArray(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function BrandCreationView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState("poetic=true\nemotional=true\ndirect=false");
  const [emotions, setEmotions] = useState("");
  const [preferredHooks, setPreferredHooks] = useState("");
  const [preferredStorytelling, setPreferredStorytelling] = useState("");
  const [preferredCta, setPreferredCta] = useState("subtle");
  const [forbiddenPatterns, setForbiddenPatterns] = useState("");
  const createBrand = useMutation({
    mutationFn: async (input: BrandCreateInput): Promise<BrandDna> => {
      const response = await apiFetch("/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel criar a marca.");
      }

      return response.json();
    },
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      router.push(`/brands/${brand.brand.id}`);
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const forbidden = textToArray(forbiddenPatterns);

    createBrand.mutate({
      name,
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
    <main className="brands-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Nova Marca</h1>
      </section>

      {createBrand.error ? <p className="error">{createBrand.error.message}</p> : null}

      <form className="brand-editor" onSubmit={handleSubmit}>
        <label>
          Nome da marca
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Orgulho do Leao" required />
        </label>

        <label>
          Proposito
          <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} rows={4} required />
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
          <button type="submit" disabled={createBrand.isPending}>
            {createBrand.isPending ? "Criando..." : "Criar marca"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function BrandCreationPage() {
  return (
    <QueryProvider>
      <BrandCreationView />
    </QueryProvider>
  );
}
