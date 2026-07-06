"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Navigation } from "../../../components/navigation";
import { QueryProvider } from "../../query-provider";

const apiUrl = process.env.NEXT_PUBLIC_PHOENIX_API_URL ?? "http://127.0.0.1:4000";

type ArchivedBrand = {
  id: string;
  nome: string;
  arquivado_em: string;
  arquivo: string;
};

type RestoredBrand = {
  brand: {
    id: string;
    name: string;
  };
};

function ArchivedBrandsView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const archivedBrands = useQuery({
    queryKey: ["archived-brands"],
    queryFn: async (): Promise<ArchivedBrand[]> => {
      const response = await fetch(`${apiUrl}/brands/archived`);

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar marcas arquivadas.");
      }

      return response.json();
    }
  });
  const restoreBrand = useMutation({
    mutationFn: async (brandId: string): Promise<RestoredBrand> => {
      const response = await fetch(`${apiUrl}/brands/${brandId}/restore`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel restaurar a marca.");
      }

      return response.json();
    },
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: ["archived-brands"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      router.push(`/brands/${brand.brand.id}`);
    }
  });

  return (
    <main className="brands-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Marcas arquivadas</h1>
      </section>

      {archivedBrands.isLoading ? <p className="muted">Carregando marcas arquivadas...</p> : null}
      {archivedBrands.error ? <p className="error">{archivedBrands.error.message}</p> : null}
      {restoreBrand.error ? <p className="error">{restoreBrand.error.message}</p> : null}
      {archivedBrands.data?.length === 0 ? (
        <section className="empty-state">
          <h2>Nenhuma marca arquivada</h2>
          <p>As marcas arquivadas aparecerao aqui para restauracao segura.</p>
        </section>
      ) : null}
      {archivedBrands.data && archivedBrands.data.length > 0 ? (
        <section className="archived-brand-list">
          {archivedBrands.data.map((brand) => (
            <article className="archived-brand-card" key={`${brand.id}-${brand.arquivado_em}`}>
              <header>
                <div>
                  <p>{brand.id}</p>
                  <h2>{brand.nome}</h2>
                </div>
                <button type="button" disabled={restoreBrand.isPending} onClick={() => restoreBrand.mutate(brand.id)}>
                  {restoreBrand.isPending ? "Restaurando..." : "Restaurar"}
                </button>
              </header>

              <dl>
                <div>
                  <dt>Arquivado em</dt>
                  <dd>{brand.arquivado_em}</dd>
                </div>
                <div>
                  <dt>Arquivo</dt>
                  <dd>{brand.arquivo}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}

export default function ArchivedBrandsPage() {
  return (
    <QueryProvider>
      <ArchivedBrandsView />
    </QueryProvider>
  );
}
