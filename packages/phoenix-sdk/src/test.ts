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
  if (path === "/plugins") {
    return new Response(JSON.stringify([{ id: "hello-world", status: "enabled", manifest: { id: "hello-world", name: "Hello World", version: "1.0.0", engine: "^1.0.0", author: "Phoenix AI", capabilities: ["tool"] }, path: "plugins/hello-world", installedAt: "2026-07-17T00:00:00.000Z", logs: [] }]), { status: 200 });
  }
  if (path === "/workflows") {
    return new Response(JSON.stringify([{ id: "workflow-test", name: "Workflow Test", trigger: { type: "manual" }, nodes: [], edges: [], variables: {}, metadata: { workspace_id: "default-workspace", created_at: "", updated_at: "", version: "1.0" } }]), { status: 200 });
  }
  if (path === "/events") {
    return new Response(JSON.stringify([{ event_id: "event-test", type: "workflow.completed", workspace_id: "default-workspace", timestamp: "", origin: "sdk-test", payload: {} }]), { status: 200 });
  }
  if (path === "/webhooks") {
    return new Response(JSON.stringify([{ id: "webhook-test", url: "https://example.com/webhook", events: ["workflow.completed"], status: "active", retries: 5, timeout_ms: 10000, created_at: "", updated_at: "", has_secret: true }]), { status: 200 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

const phoenix = new PhoenixClient({ baseUrl: "http://127.0.0.1:4000", apiKey: "test", fetch: mockFetch });
const result = await phoenix.tasks.create({ brand: "encanto-intenso", theme: "saudade", objective: "viralizar", platform: "instagram", format: "reel" });
if (result.execution.trace_id !== "trace-ok") throw new Error("SDK did not preserve trace_id.");
const plugins = await phoenix.plugins.list();
if (plugins[0]?.id !== "hello-world") throw new Error("SDK plugins resource failed.");
const workflows = await phoenix.workflows.list();
if (workflows[0]?.id !== "workflow-test") throw new Error("SDK workflows resource failed.");
const events = await phoenix.events.list();
if (events[0]?.event_id !== "event-test") throw new Error("SDK events resource failed.");
const webhooks = await phoenix.webhooks.list();
if (webhooks[0]?.id !== "webhook-test") throw new Error("SDK webhooks resource failed.");

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
