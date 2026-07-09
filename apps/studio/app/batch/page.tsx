"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type TaskFormat = "reel" | "carousel" | "story";

type BatchRow = {
  id: string;
  brand: string;
  theme: string;
  objective: string;
  platform: string;
  format: TaskFormat;
};

type Brand = {
  brand?: {
    id?: string;
    name?: string;
  };
};

type BatchItemResult = {
  index: number;
  status: "success" | "error";
  error?: string;
  result?: {
    status: string;
    execution_id: string;
    score: number;
    execution_time: number;
    media_package?: {
      directory: string;
      files: string[];
    };
    output?: {
      hook?: string;
      caption?: string;
      hashtags?: string[];
    };
  };
};

type BatchResult = {
  status: "success" | "partial_success";
  total: number;
  success: number;
  failed: number;
  results: BatchItemResult[];
};

const defaultRows: BatchRow[] = [
  createRow("batch-row-1", "saudade", "viralizar"),
  createRow("batch-row-2", "reencontro", "engajar"),
  createRow("batch-row-3", "silencio", "salvamentos")
];

function createRow(id: string, theme = "", objective = ""): BatchRow {
  return {
    id,
    brand: "encanto-intenso",
    theme,
    objective,
    platform: "instagram",
    format: "reel"
  };
}

function BatchView() {
  const [rows, setRows] = useState<BatchRow[]>(defaultRows);
  const brands = useQuery({
    queryKey: ["brands"],
    queryFn: async (): Promise<Brand[]> => {
      const response = await apiFetch("/brands");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar marcas.");
      }

      return response.json();
    }
  });
  const mutation = useMutation({
    mutationFn: async (items: BatchRow[]): Promise<BatchResult> => {
      const response = await apiFetch("/tasks/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: items.map(({ id: _id, ...task }) => task)
        })
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel executar o lote.");
      }

      return response.json();
    }
  });

  function updateRow<K extends keyof BatchRow>(rowId: string, field: K, value: BatchRow[K]) {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((current) => [...current, createRow(`batch-row-${Date.now()}`)]);
  }

  function removeRow(rowId: string) {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== rowId) : current));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(rows);
  }

  return (
    <main className="batch-shell">
      <Navigation />

      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix Studio</p>
          <h1>Batch Task Runner</h1>
        </div>
        <button className="secondary-action" onClick={addRow} type="button">
          Adicionar linha
        </button>
      </section>

      {brands.error ? <p className="error">{brands.error.message}</p> : null}

      <form className="batch-form" onSubmit={handleSubmit}>
        <div className="batch-table">
          <div className="batch-table-heading" aria-hidden="true">
            <span>Marca</span>
            <span>Tema</span>
            <span>Objetivo</span>
            <span>Formato</span>
            <span>Acao</span>
          </div>

          {rows.map((row, index) => (
            <article className="batch-row" key={row.id}>
              <label>
                Marca
                <select value={row.brand} onChange={(event) => updateRow(row.id, "brand", event.target.value)}>
                  {brands.data?.map((brand) => {
                    const id = brand.brand?.id ?? "";
                    const name = brand.brand?.name ?? id;

                    return id ? (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ) : null;
                  })}
                  {!brands.data?.some((brand) => brand.brand?.id === row.brand) ? <option value={row.brand}>{row.brand}</option> : null}
                </select>
              </label>

              <label>
                Tema
                <input
                  onChange={(event) => updateRow(row.id, "theme", event.target.value)}
                  placeholder="Saudade"
                  required
                  value={row.theme}
                />
              </label>

              <label>
                Objetivo
                <input
                  onChange={(event) => updateRow(row.id, "objective", event.target.value)}
                  placeholder="Viralizar"
                  required
                  value={row.objective}
                />
              </label>

              <label>
                Formato
                <select value={row.format} onChange={(event) => updateRow(row.id, "format", event.target.value as TaskFormat)}>
                  <option value="reel">Reel</option>
                  <option value="carousel">Carrossel</option>
                  <option value="story">Story</option>
                </select>
              </label>

              <button disabled={rows.length === 1} onClick={() => removeRow(row.id)} type="button">
                Remover {index + 1}
              </button>
            </article>
          ))}
        </div>

        <button className="primary-action" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? "Executando lote..." : "Executar lote"}
        </button>
      </form>

      <section className="batch-results">
        <header>
          <div>
            <p>Resultado</p>
            <h2>Execucoes do lote</h2>
          </div>
          {mutation.data ? (
            <span>
              {mutation.data.success}/{mutation.data.total} concluido
            </span>
          ) : null}
        </header>

        {!mutation.data && !mutation.error ? <p className="muted">Execute um lote para ver o resultado por item.</p> : null}
        {mutation.error ? <p className="error">{mutation.error.message}</p> : null}

        {mutation.data ? (
          <div className="batch-result-list">
            {mutation.data.results.map((item) => (
              <article className="batch-result-card" key={item.index}>
                <header>
                  <div>
                    <p>Item {item.index + 1}</p>
                    <h3>{item.result?.output?.hook ?? item.error ?? "Resultado indisponivel"}</h3>
                  </div>
                  <span data-status={item.status}>{item.status}</span>
                </header>

                {item.result ? (
                  <dl>
                    <div>
                      <dt>Score</dt>
                      <dd>{item.result.score}</dd>
                    </div>
                    <div>
                      <dt>Tempo</dt>
                      <dd>{item.result.execution_time}s</dd>
                    </div>
                    <div>
                      <dt>Pacote</dt>
                      <dd>{item.result.media_package?.directory ?? "-"}</dd>
                    </div>
                  </dl>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function BatchPage() {
  return (
    <QueryProvider>
      <BatchView />
    </QueryProvider>
  );
}
