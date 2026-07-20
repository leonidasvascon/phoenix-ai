import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { assertPhoenixEnv } from "@phoenix-ai/config";
import { ensureIdentityStorage } from "@phoenix-ai/identity";
import { discoverPlugins, ensurePluginStorage } from "@phoenix-ai/plugin-sdk";
import { ensureSecretsStorage } from "@phoenix-ai/secrets";
import { ensureDefaultWorkspaceMigration, resolveWorkspaceContext } from "@phoenix-ai/workspace";
import { basename, dirname, resolve } from "node:path";
import { authenticateRequest, headersWithAuthenticatedUser } from "./auth/identity-auth.ts";
import { sendJson } from "./http.ts";
import { handleAnalyticsRoute } from "./routes/analytics.ts";
import { handleAuthRoute } from "./routes/auth.ts";
import { handleBatchTemplatesRoute } from "./routes/batch-templates.ts";
import { handleBrandsRoute } from "./routes/brands.ts";
import { handleCostRoute } from "./routes/cost.ts";
import { handleDlqRoute } from "./routes/dlq.ts";
import { handleEventsRoute } from "./routes/events.ts";
import { handleExecutionsRoute } from "./routes/executions.ts";
import { handleEvaluationRoute } from "./routes/evaluation.ts";
import { handleFeedbackRoute } from "./routes/feedback.ts";
import { handleHealthRoute } from "./routes/health.ts";
import { handleInvitationsRoute } from "./routes/invitations.ts";
import { handleKnowledgeRoute } from "./routes/knowledge.ts";
import { handleLearningRoute } from "./routes/learning.ts";
import { handleModelsRoute } from "./routes/models.ts";
import { handleObservabilityRoute } from "./routes/observability.ts";
import { handleOpenApiRoute } from "./routes/openapi.ts";
import { ApiError } from "./errors/api-error.ts";
import { sendApiError } from "./errors/error-handler.ts";
import { handlePromptOptimizationsRoute } from "./routes/prompt-optimizations.ts";
import { handlePluginsRoute } from "./routes/plugins.ts";
import { handlePublicationsRoute } from "./routes/publications.ts";
import { handleQualityRoute } from "./routes/quality.ts";
import { handleProvidersRoute } from "./routes/providers.ts";
import { handleScheduledJobsRoute } from "./routes/scheduled-jobs.ts";
import { handleApiKeysRoute, handleSecretsRoute } from "./routes/secrets.ts";
import { handleSettingsRoute } from "./routes/settings.ts";
import { handleSocialConnectionsRoute } from "./routes/social-connections.ts";
import { handleStrategyRoute } from "./routes/strategy.ts";
import { handleTasksRoute } from "./routes/tasks.ts";
import { handleTaskTemplatesRoute } from "./routes/task-templates.ts";
import { handleUsersRoute } from "./routes/users.ts";
import { handleVideoJobsRoute } from "./routes/video-jobs.ts";
import { handleVersionRoute } from "./routes/version.ts";
import { handleWebhooksRoute } from "./routes/webhooks.ts";
import { handleWorkflowsRoute } from "./routes/workflows.ts";
import { handleWorkspacesRoute } from "./routes/workspaces.ts";
import { enforceRateLimit } from "./rate-limit.ts";
import { startSchedulerWorker } from "./workers/scheduler-worker.ts";
import { incrementCounter, logStructured, recordDuration, withSpan } from "@phoenix-ai/observability";

const port = Number(process.env.PHOENIX_API_PORT ?? 4000);
const host = process.env.PHOENIX_API_HOST ?? "127.0.0.1";

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
  "/auth": handleAuthRoute,
  "/api-keys": handleApiKeysRoute,
  "/tasks": handleTasksRoute,
  "/executions": handleExecutionsRoute,
  "/evaluation": handleEvaluationRoute,
  "/feedback": handleFeedbackRoute,
  "/health": handleHealthRoute,
  "/invitations": handleInvitationsRoute,
  "/knowledge": handleKnowledgeRoute,
  "/learning": handleLearningRoute,
  "/metrics": handleObservabilityRoute,
  "/models": handleModelsRoute,
  "/observability": handleObservabilityRoute,
  "/cost": handleCostRoute,
  "/openapi.json": handleOpenApiRoute,
  "/openapi.yaml": handleOpenApiRoute,
  "/docs": handleOpenApiRoute,
  "/dlq": handleDlqRoute,
  "/events": handleEventsRoute,
  "/prompt-optimizations": handlePromptOptimizationsRoute,
  "/plugins": handlePluginsRoute,
  "/publications": handlePublicationsRoute,
  "/quality": handleQualityRoute,
  "/providers": handleProvidersRoute,
  "/analytics": handleAnalyticsRoute,
  "/batch-templates": handleBatchTemplatesRoute,
  "/brands": handleBrandsRoute,
  "/scheduled-jobs": handleScheduledJobsRoute,
  "/secrets": handleSecretsRoute,
  "/settings": handleSettingsRoute,
  "/social-connections": handleSocialConnectionsRoute,
  "/strategy": handleStrategyRoute,
  "/task-templates": handleTaskTemplatesRoute,
  "/video-jobs": handleVideoJobsRoute,
  "/version": handleVersionRoute,
  "/webhooks": handleWebhooksRoute,
  "/workflows": handleWorkflowsRoute,
  "/users": handleUsersRoute,
  "/workspaces": handleWorkspacesRoute
};

function resolveRoute(pathname: string): ApiHandler | undefined {
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api-keys/") ||
    pathname.startsWith("/tasks/") ||
    pathname.startsWith("/batch-templates/") ||
    pathname.startsWith("/dlq/") ||
    pathname.startsWith("/events/") ||
    pathname.startsWith("/executions/") ||
    pathname.startsWith("/evaluation/") ||
    pathname.startsWith("/feedback/") ||
    pathname.startsWith("/health/") ||
    pathname.startsWith("/invitations/") ||
    pathname.startsWith("/knowledge/") ||
    pathname.startsWith("/learning/") ||
    pathname.startsWith("/models/") ||
    pathname.startsWith("/observability/") ||
    pathname.startsWith("/openapi.") ||
    pathname.startsWith("/prompt-optimizations/") ||
    pathname.startsWith("/plugins/") ||
    pathname.startsWith("/publications/") ||
    pathname.startsWith("/quality/") ||
    pathname.startsWith("/providers/") ||
    pathname.startsWith("/brands/") ||
    pathname.startsWith("/cost/") ||
    pathname.startsWith("/scheduled-jobs/") ||
    pathname.startsWith("/secrets/") ||
    pathname.startsWith("/social-connections/") ||
    pathname.startsWith("/strategy/") ||
    pathname.startsWith("/task-templates/") ||
    pathname.startsWith("/video-jobs/") ||
    pathname.startsWith("/version/") ||
    pathname.startsWith("/webhooks/") ||
    pathname.startsWith("/workflows/") ||
    pathname.startsWith("/users/") ||
    pathname.startsWith("/workspaces/")
  ) {
    return routes[`/${pathname.split("/")[1]}`];
  }

  return routes[pathname];
}

ensureRepositoryRoot();
assertPhoenixEnv();
await ensureDefaultWorkspaceMigration();
await ensureIdentityStorage();
await ensureSecretsStorage();
await ensurePluginStorage();
await discoverPlugins();
startSchedulerWorker();

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const route = resolveRoute(url.pathname);
  const startedAt = performance.now();
  let statusCode = 200;
  const originalWriteHead = response.writeHead.bind(response);
  response.writeHead = ((status: number, ...args: Parameters<ServerResponse["writeHead"]> extends [number, ...infer Rest] ? Rest : never) => {
    statusCode = status;
    return originalWriteHead(status, ...args);
  }) as ServerResponse["writeHead"];

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  try {
    enforceRateLimit(request);
  } catch (error) {
    sendApiError(response, error);
    return;
  }

  const publicRoute = url.pathname === "/health" || url.pathname === "/health/live" || url.pathname === "/health/ready" || url.pathname === "/version" || url.pathname === "/openapi.json" || url.pathname === "/openapi.yaml" || url.pathname === "/docs" || url.pathname.startsWith("/auth/") || url.pathname.startsWith("/invitations/");
  const auth = await authenticateRequest(request);

  if (!publicRoute && !auth.authenticated) {
    sendApiError(response, new ApiError(auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", auth.message, auth.status));
    return;
  }

  if (!publicRoute) {
    try {
      const headers = headersWithAuthenticatedUser(request.headers, auth.authenticated && auth.kind === "user" ? auth.userId : undefined);
      if (auth.authenticated && auth.kind === "service" && auth.workspaceId) headers["x-phoenix-workspace-id"] = auth.workspaceId;
      await resolveWorkspaceContext(headers);
    } catch (error) {
      sendApiError(response, new ApiError("FORBIDDEN", error instanceof Error ? error.message : "Invalid workspace context.", 403));
      return;
    }
  }

  if (!route) {
    sendApiError(response, new ApiError("NOT_FOUND", "Route not found.", 404));
    return;
  }

  await withSpan("phoenix.http.request", {
    "http.request.method": request.method ?? "GET",
    "url.path": url.pathname,
    route: url.pathname
  }, async () => {
    logStructured("info", "api.request.started", {
      method: request.method,
      route: url.pathname
    });
    try {
      await route(request, response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown API error.";
      sendApiError(response, error);
    } finally {
      const durationMs = Math.round(performance.now() - startedAt);
      incrementCounter("phoenix_http_requests_total", {
        method: request.method ?? "GET",
        route: url.pathname,
        status_code: statusCode
      });
      recordDuration("phoenix_http_request_duration_ms", durationMs, {
        method: request.method ?? "GET",
        route: url.pathname,
        status_code: statusCode
      });
      logStructured("info", "api.request.completed", {
        method: request.method,
        route: url.pathname,
        status_code: statusCode,
        duration_ms: durationMs
      });
    }
  });
});

server.listen(port, host, () => {
  console.log(`Phoenix API running at http://${host}:${port}`);
});
