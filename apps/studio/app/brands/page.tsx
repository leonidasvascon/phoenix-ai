"use client";

import { useQuery } from "@tanstack/react-query";
import { BrandCard, type BrandDna } from "../../components/brand-card";
import { Navigation } from "../../components/navigation";
import { QueryProvider } from "../query-provider";

const apiUrl = process.env.NEXT_PUBLIC_PHOENIX_API_URL ?? "http://127.0.0.1:4000";

function BrandsView() {
  const brands = useQuery({
    queryKey: ["brands"],
    queryFn: async (): Promise<BrandDna[]> => {
      const response = await fetch(`${apiUrl}/brands`);

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar marcas.");
      }

      return response.json();
    }
  });

  return (
    <main className="brands-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Marcas</h1>
      </section>

      {brands.isLoading ? <p className="muted">Carregando marcas...</p> : null}
      {brands.error ? <p className="error">{brands.error.message}</p> : null}
      {brands.data?.length === 0 ? (
        <section className="empty-state">
          <h2>Nenhuma marca encontrada</h2>
          <p>Adicione um Brand DNA em prompts/brands para comecar.</p>
        </section>
      ) : null}
      {brands.data && brands.data.length > 0 ? (
        <section className="brand-list">
          {brands.data.map((brand) => (
            <BrandCard brand={brand} key={brand.brand.id} />
          ))}
        </section>
      ) : null}
    </main>
  );
}

export default function BrandsPage() {
  return (
    <QueryProvider>
      <BrandsView />
    </QueryProvider>
  );
}
