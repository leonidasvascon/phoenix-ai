"use client";

import Link from "next/link";

export type BrandDna = {
  version: string | number;
  brand: {
    id: string;
    name: string;
  };
  purpose?: string;
  personality?: Record<string, unknown>;
  tone?: Record<string, unknown>;
  writing?: Record<string, unknown>;
  visual?: Record<string, unknown>;
  content?: Record<string, unknown>;
  emotions?: string[];
  avoid?: string[];
  success_metrics?: Record<string, unknown>;
  preferred_hooks?: string[];
  preferred_storytelling?: string[];
  preferred_cta?: string;
  preferred_emotions?: string[];
  forbidden_patterns?: string[];
  [key: string]: unknown;
};

function activeTraits(personality?: Record<string, unknown>): string[] {
  if (!personality) return [];

  return Object.entries(personality)
    .filter(([, value]) => value === true)
    .map(([key]) => key.replace(/_/g, " "));
}

export function BrandCard({ brand }: Readonly<{ brand: BrandDna }>) {
  const traits = activeTraits(brand.personality);

  return (
    <article className="brand-card">
      <header>
        <div>
          <p>{brand.brand.id}</p>
          <h2>{brand.brand.name}</h2>
        </div>
        <Link href={`/brands/${brand.brand.id}`}>Ver DNA</Link>
      </header>

      <p>{brand.purpose ?? "Proposito nao informado."}</p>

      {traits.length > 0 ? (
        <ul>
          {traits.map((trait) => (
            <li key={trait}>{trait}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
