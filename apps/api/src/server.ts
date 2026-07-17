import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { assertPhoenixEnv } from "@phoenix-ai/config";
import { basename, dirname, resolve } from "node:path";
import { authenticateApiKey } from "./auth/api-key-auth.ts";
import { sendJson } from "./http.ts";
import { handleAnalyticsRoute } from "./routes/analytics.ts";
import { handleBatchTemplatesRoute } from "./routes/batch-templates.ts";
import { handleBrandsRoute } from "./routes/brands.ts";
import { handleExecutionsRoute } from "./routes/executions.ts";
import { handleEvaluationRoute } from "./routes/evaluation.ts";
import { handleFeedbackRoute } from "./routes/feedback.ts";
import { handleHealthRoute } from "./routes/health.ts";
import { handleLearningRoute } from "./routes/learning.ts";
import { handleObservabilityRoute } from "./routes/observability.ts";
import { handleOpenApiRoute } from "./routes/openapi.ts";
import { ApiError } from "./errors/api-error.ts";
import { sendApiError } from "./errors/error-handler.ts";
import { handlePromptOptimizationsRoute } from "./routes/prompt-optimizations.ts";
import { handlePublicationsRoute } from "./routes/publications.ts";
import { handleQualityRoute } from "./routes/quality.ts";
import { handleProvidersRoute } from "./routes/providers.ts";
import { handleScheduledJobsRoute } from "./routes/scheduled-jobs.ts";
import { handleSettingsRoute } from "./routes/settings.ts";
import { handleStrategyRoute } from "./routes/strategy.ts";
import { handleTasksRoute } from "./routes/tasks.ts";
import { handleTaskTemplatesRoute } from "./routes/task-templates.ts";
import { handleVideoJobsRoute } from "./routes/video-jobs.ts";
import { handleVersionRoute } from "./routes/version.ts";
import { enforceRateLimit } from "./rate-limit.ts";
import { startSchedulerWorker } from "./workers/scheduler-worker.ts";
import { incrementCounter, logStructured, recordDuration, withSpan } from "@phoenix-ai/observability";

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
  "/evaluation": handleEvaluationRoute,
  "/feedback": handleFeedbackRoute,
  "/health": handleHealthRoute,
  "/learning": handleLearningRoute,
  "/metrics": handleObservabilityRoute,
  "/observability": handleObservabilityRoute,
  "/openapi.json": handleOpenApiRoute,
  "/openapi.yaml": handleOpenApiRoute,
  "/docs": handleOpenApiRoute,
  "/prompt-optimizations": handlePromptOptimizationsRoute,
  "/publications": handlePublicationsRoute,
  "/quality": handleQualityRoute,
  "/providers": handleProvidersRoute,
  "/analytics": handleAnalyticsRoute,
  "/batch-templates": handleBatchTemplatesRoute,
  "/brands": handleBrandsRoute,
  "/scheduled-jobs": handleScheduledJobsRoute,
  "/settings": handleSettingsRoute,
  "/strategy": handleStrategyRoute,
  "/task-templates": handleTaskTemplatesRoute,
  "/video-jobs": handleVideoJobsRoute,
  "/version": handleVersionRoute
};

function resolveRoute(pathname: string): ApiHandler | undefined {
  if (
    pathname.startsWith("/tasks/") ||
    pathname.startsWith("/batch-templates/") ||
    pathname.startsWith("/executions/") ||
    pathname.startsWith("/evaluation/") ||
    pathname.startsWith("/feedback/") ||
    pathname.startsWith("/health/") ||
    pathname.startsWith("/learning/") ||
    pathname.startsWith("/observability/") ||
    pathname.startsWith("/openapi.") ||
    pathname.startsWith("/prompt-optimizations/") ||
    pathname.startsWith("/publications/") ||
    pathname.startsWith("/quality/") ||
    pathname.startsWith("/providers/") ||
    pathname.startsWith("/brands/") ||
    pathname.startsWith("/scheduled-jobs/") ||
    pathname.startsWith("/strategy/") ||
    pathname.startsWith("/task-templates/") ||
    pathname.startsWith("/video-jobs/") ||
    pathname.startsWith("/version/")
  ) {
    return routes[`/${pathname.split("/")[1]}`];
  }

  return routes[pathname];
}

ensureRepositoryRoot();
assertPhoenixEnv();
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

  const publicHealth = url.pathname === "/health" || url.pathname === "/health/live" || url.pathname === "/health/ready" || url.pathname === "/version" || url.pathname === "/openapi.json" || url.pathname === "/openapi.yaml" || url.pathname === "/docs";
  const auth = authenticateApiKey(request);

  if (!publicHealth && !auth.authenticated) {
    sendApiError(response, new ApiError(auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", auth.message, auth.status));
    return;
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

server.listen(port, "127.0.0.1", () => {
  console.log(`Phoenix API running at http://127.0.0.1:${port}`);
});
