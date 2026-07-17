import { PhoenixClient, PhoenixApiError } from "./index.ts";

const mockFetch: typeof fetch = async (url, init) => {
  const path = new URL(String(url)).pathname;
  const headers = new Headers(init?.headers);
  if (!headers.get("X-Phoenix-Api-Key") && !headers.get("Authorization")) {
    return errorResponse("UNAUTHORIZED", 401, "trace-401");
  }
  if (path === "/forbidden") return errorResponse("FORBIDDEN", 403, "trace-403");
  if (path === "/missing") return errorResponse("NOT_FOUND", 404, "trace-404");
  if (path === "/conflict") return errorResponse("CONFLICT", 409, "trace-409");
  if (path === "/tasks") {
    return new Response(JSON.stringify({ status: "success", execution_id: "sdk-test", score: 95, execution: { id: "sdk-test", trace_id: "trace-ok" }, output: {} }), { status: 200 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

const phoenix = new PhoenixClient({ baseUrl: "http://127.0.0.1:4000", apiKey: "test", fetch: mockFetch });
const result = await phoenix.tasks.create({ brand: "encanto-intenso", theme: "saudade", objective: "viralizar", platform: "instagram", format: "reel" });
if (result.execution.trace_id !== "trace-ok") throw new Error("SDK did not preserve trace_id.");

await expectError(new PhoenixClient({ baseUrl: "http://127.0.0.1:4000", fetch: mockFetch }).tasks.create({ brand: "encanto-intenso", theme: "saudade", objective: "viralizar", platform: "instagram", format: "reel" }), 401, "trace-401");
await expectError(phoenix.request("/forbidden"), 403, "trace-403");
await expectError(phoenix.request("/missing"), 404, "trace-404");
await expectError(phoenix.request("/conflict"), 409, "trace-409");

console.log(JSON.stringify({ status: "pass", execution_id: result.execution_id }, null, 2));

function errorResponse(code: string, status: number, traceId: string): Response {
  return new Response(JSON.stringify({ error: { code, message: code, status, trace_id: traceId } }), { status });
}

async function expectError(promise: Promise<unknown>, status: number, traceId: string): Promise<void> {
  try {
    await promise;
    throw new Error(`Expected ${status}.`);
  } catch (error) {
    if (!(error instanceof PhoenixApiError) || error.status !== status || error.traceId !== traceId) {
      throw error;
    }
  }
}
