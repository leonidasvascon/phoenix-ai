"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { BrandDna } from "../../../components/brand-card";
import { Navigation } from "../../../components/navigation";
import { QueryProvider } from "../../query-provider";

const apiUrl = process.env.NEXT_PUBLIC_PHOENIX_API_URL ?? "http://127.0.0.1:4000";

function BrandImportView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [yaml, setYaml] = useState("");
  const importBrand = useMutation({
    mutationFn: async (source: string): Promise<BrandDna> => {
      const response = await fetch(`${apiUrl}/brands/import`, {
        method: "POST",
        headers: {
          "Content-Type": "text/yaml"
        },
        body: source
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "Nao foi possivel importar a marca.");
      }

      return payload;
    },
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      router.push(`/brands/${brand.brand.id}`);
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    importBrand.mutate(yaml);
  }

  return (
    <main className="brands-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Importar marca</h1>
      </section>

      <form className="brand-import-form" onSubmit={handleSubmit}>
        <label>
          Brand DNA em YAML
          <textarea
            value={yaml}
            onChange={(event) => setYaml(event.target.value)}
            placeholder={"version: 1.0\nbrand:\n  id: minha-marca\n  name: Minha Marca\npurpose: |\n  Proposito da marca."}
            required
            rows={20}
          />
        </label>
        {importBrand.error ? <p className="error">{importBrand.error.message}</p> : null}
        <button type="submit" disabled={importBrand.isPending}>
          {importBrand.isPending ? "Importando..." : "Importar marca"}
        </button>
      </form>
    </main>
  );
}

export default function BrandImportPage() {
  return (
    <QueryProvider>
      <BrandImportView />
    </QueryProvider>
  );
}
