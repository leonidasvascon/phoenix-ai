import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { basename, dirname, resolve } from "node:path";
import { sendJson } from "./http.ts";
import { handleAnalyticsRoute } from "./routes/analytics.ts";
import { handleBrandsRoute } from "./routes/brands.ts";
import { handleExecutionsRoute } from "./routes/executions.ts";
import { handleTasksRoute } from "./routes/tasks.ts";

const port = Number(process.env.PHOENIX_API_PORT ?? 4000);

export type ApiHandler = (request: IncomingMessage, response: ServerResponse) => Promise<void>;

function ensureRepositoryRoot(): void {
  if (basename(process.cwd()) === "api" && basename(dirname(process.cwd())) === "apps") {
    process.chdir(resolve(process.cwd(), "../.."));
  }
}

function notFound(response: ServerResponse): void {
  sendJson(response, 404, {
    status: "error",
    message: "Route not found."
  });
}

const routes: Record<string, ApiHandler> = {
  "/tasks": handleTasksRoute,
  "/executions": handleExecutionsRoute,
  "/analytics": handleAnalyticsRoute,
  "/brands": handleBrandsRoute
};

ensureRepositoryRoot();

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const route = url.pathname.startsWith("/executions/") ? handleExecutionsRoute : routes[url.pathname];

  if (!route) {
    notFound(response);
    return;
  }

  try {
    await route(request, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown API error.";
    sendJson(response, 500, {
      status: "error",
      message
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Phoenix API running at http://127.0.0.1:${port}`);
});
