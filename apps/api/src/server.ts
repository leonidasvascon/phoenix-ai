import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { basename, dirname, resolve } from "node:path";
import { authenticateApiKey } from "./auth/api-key-auth.ts";
import { sendJson } from "./http.ts";
import { handleAnalyticsRoute } from "./routes/analytics.ts";
import { handleBatchTemplatesRoute } from "./routes/batch-templates.ts";
import { handleBrandsRoute } from "./routes/brands.ts";
import { handleExecutionsRoute } from "./routes/executions.ts";
import { handleEvaluationRoute } from "./routes/evaluation.ts";
import { handleFeedbackRoute } from "./routes/feedback.ts";
import { handleLearningRoute } from "./routes/learning.ts";
import { handlePromptOptimizationsRoute } from "./routes/prompt-optimizations.ts";
import { handlePublicationsRoute } from "./routes/publications.ts";
import { handleProvidersRoute } from "./routes/providers.ts";
import { handleScheduledJobsRoute } from "./routes/scheduled-jobs.ts";
import { handleSettingsRoute } from "./routes/settings.ts";
import { handleStrategyRoute } from "./routes/strategy.ts";
import { handleTasksRoute } from "./routes/tasks.ts";
import { handleTaskTemplatesRoute } from "./routes/task-templates.ts";
import { handleVideoJobsRoute } from "./routes/video-jobs.ts";
import { startSchedulerWorker } from "./workers/scheduler-worker.ts";

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
  "/learning": handleLearningRoute,
  "/prompt-optimizations": handlePromptOptimizationsRoute,
  "/publications": handlePublicationsRoute,
  "/providers": handleProvidersRoute,
  "/analytics": handleAnalyticsRoute,
  "/batch-templates": handleBatchTemplatesRoute,
  "/brands": handleBrandsRoute,
  "/scheduled-jobs": handleScheduledJobsRoute,
  "/settings": handleSettingsRoute,
  "/strategy": handleStrategyRoute,
  "/task-templates": handleTaskTemplatesRoute,
  "/video-jobs": handleVideoJobsRoute
};

function resolveRoute(pathname: string): ApiHandler | undefined {
  if (
    pathname.startsWith("/tasks/") ||
    pathname.startsWith("/batch-templates/") ||
    pathname.startsWith("/executions/") ||
    pathname.startsWith("/evaluation/") ||
    pathname.startsWith("/feedback/") ||
    pathname.startsWith("/learning/") ||
    pathname.startsWith("/prompt-optimizations/") ||
    pathname.startsWith("/publications/") ||
    pathname.startsWith("/providers/") ||
    pathname.startsWith("/brands/") ||
    pathname.startsWith("/scheduled-jobs/") ||
    pathname.startsWith("/strategy/") ||
    pathname.startsWith("/task-templates/") ||
    pathname.startsWith("/video-jobs/")
  ) {
    return routes[`/${pathname.split("/")[1]}`];
  }

  return routes[pathname];
}

ensureRepositoryRoot();
startSchedulerWorker();

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const auth = authenticateApiKey(request);

  if (!auth.authenticated) {
    sendJson(response, auth.status, {
      status: "error",
      message: auth.message
    });
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const route = resolveRoute(url.pathname);

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
