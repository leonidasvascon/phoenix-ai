import { protectedSecurity } from "./security.ts";

const json = (schema: unknown) => ({
  content: {
    "application/json": {
      schema
    }
  }
});
const ok = (description: string, schema: unknown = { type: "object", additionalProperties: true }) => ({
  description,
  ...json(schema)
});
const errorRef = { $ref: "#/components/schemas/ErrorResponse" };
const errors = {
  "400": ok("Bad request", errorRef),
  "401": ok("Unauthorized", errorRef),
  "403": ok("Forbidden", errorRef),
  "404": ok("Not found", errorRef),
  "409": ok("Conflict", errorRef),
  "500": ok("Internal error", errorRef)
};
const secured = { security: protectedSecurity };

export const paths = {
  "/auth/login": {
    post: {
      tags: ["Identity"],
      summary: "Create a local user session",
      requestBody: json({ type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string", format: "password" } } }),
      responses: { "200": ok("Authenticated"), ...errors }
    }
  },
  "/auth/logout": { post: { ...secured, tags: ["Identity"], summary: "End current session", responses: { "200": ok("Logged out"), ...errors } } },
  "/auth/me": { get: { ...secured, tags: ["Identity"], summary: "Get current user", responses: { "200": ok("Current user"), ...errors } } },
  "/auth/sessions": { get: { ...secured, tags: ["Identity"], summary: "List current user sessions", responses: { "200": ok("Sessions"), ...errors } } },
  "/auth/sessions/{id}": { delete: { ...secured, tags: ["Identity"], summary: "Revoke session", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Revoked"), ...errors } } },
  "/auth/providers": { get: { tags: ["Identity"], summary: "List configured identity providers", responses: { "200": ok("Providers"), ...errors } } },
  "/auth/password/change": { post: { ...secured, tags: ["Identity"], summary: "Change password", requestBody: json({ type: "object" }), responses: { "200": ok("Changed"), ...errors } } },
  "/users": { get: { ...secured, tags: ["Identity"], summary: "List users", responses: { "200": ok("Users"), ...errors } } },
  "/users/{id}": { get: { ...secured, tags: ["Identity"], summary: "Get user", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("User"), ...errors } }, patch: { ...secured, tags: ["Identity"], summary: "Update user", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: json({ type: "object" }), responses: { "200": ok("Updated"), ...errors } } },
  "/invitations/{token}": { get: { tags: ["Identity"], summary: "Read invitation", parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Invitation"), ...errors } } },
  "/invitations/{token}/accept": { post: { tags: ["Identity"], summary: "Accept invitation", parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }], requestBody: json({ type: "object" }), responses: { "200": ok("Accepted"), ...errors } } },
  "/secrets": { get: { ...secured, tags: ["Secrets"], summary: "List secret metadata", responses: { "200": ok("Secrets"), ...errors } }, post: { ...secured, tags: ["Secrets"], summary: "Create secret", requestBody: json({ type: "object", required: ["name", "namespace", "provider"], properties: { name: { type: "string" }, namespace: { type: "string" }, provider: { type: "string" }, value: { type: "string", writeOnly: true }, envName: { type: "string" } } }), responses: { "201": ok("Secret metadata"), ...errors } } },
  "/secrets/{id}": { get: { ...secured, tags: ["Secrets"], summary: "Get secret metadata", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Secret metadata"), ...errors } } },
  "/secrets/{id}/validate": { post: { ...secured, tags: ["Secrets"], summary: "Validate secret", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Validation"), ...errors } } },
  "/secrets/{id}/rotate": { post: { ...secured, tags: ["Secrets"], summary: "Rotate secret", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: json({ type: "object", required: ["value"], properties: { value: { type: "string", writeOnly: true } } }), responses: { "200": ok("Rotated"), ...errors } } },
  "/secrets/{id}/revoke": { post: { ...secured, tags: ["Secrets"], summary: "Revoke secret", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Revoked"), ...errors } } },
  "/secrets/providers": { get: { ...secured, tags: ["Secrets"], summary: "List secret providers", responses: { "200": ok("Secret providers"), ...errors } } },
  "/secrets/status": { get: { ...secured, tags: ["Secrets"], summary: "Secret system status", responses: { "200": ok("Secret status"), ...errors } } },
  "/api-keys": { get: { ...secured, tags: ["Secrets"], summary: "List API key metadata", responses: { "200": ok("API keys"), ...errors } }, post: { ...secured, tags: ["Secrets"], summary: "Create API key", requestBody: json({ type: "object", properties: { scopes: { type: "array", items: { type: "string" } } } }), responses: { "201": ok("API key created once"), ...errors } } },
  "/api-keys/{id}/rotate": { post: { ...secured, tags: ["Secrets"], summary: "Rotate API key", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("API key rotated once"), ...errors } } },
  "/api-keys/{id}/revoke": { post: { ...secured, tags: ["Secrets"], summary: "Revoke API key", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Revoked"), ...errors } } },
  "/plugins": { get: { ...secured, tags: ["Plugins"], summary: "List installed and discovered plugins", responses: { "200": ok("Plugins"), ...errors } } },
  "/plugins/{id}": { get: { ...secured, tags: ["Plugins"], summary: "Get plugin", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Plugin"), ...errors } }, delete: { ...secured, tags: ["Plugins"], summary: "Uninstall plugin", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Uninstalled"), ...errors } } },
  "/plugins/install": { post: { ...secured, tags: ["Plugins"], summary: "Install plugin", requestBody: json({ type: "object", required: ["id"], properties: { id: { type: "string" } } }), responses: { "200": ok("Installed"), ...errors } } },
  "/plugins/enable": { post: { ...secured, tags: ["Plugins"], summary: "Enable plugin", requestBody: json({ type: "object", required: ["id"], properties: { id: { type: "string" } } }), responses: { "200": ok("Enabled"), ...errors } } },
  "/plugins/disable": { post: { ...secured, tags: ["Plugins"], summary: "Disable plugin", requestBody: json({ type: "object", required: ["id"], properties: { id: { type: "string" } } }), responses: { "200": ok("Disabled"), ...errors } } },
  "/workflows": { get: { ...secured, tags: ["Workflows"], summary: "List workflows", responses: { "200": ok("Workflows"), ...errors } }, post: { ...secured, tags: ["Workflows"], summary: "Create workflow", requestBody: json({ type: "object" }), responses: { "201": ok("Workflow created"), ...errors } } },
  "/workflows/{id}": { get: { ...secured, tags: ["Workflows"], summary: "Get workflow", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Workflow"), ...errors } }, patch: { ...secured, tags: ["Workflows"], summary: "Update workflow", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: json({ type: "object" }), responses: { "200": ok("Workflow updated"), ...errors } }, delete: { ...secured, tags: ["Workflows"], summary: "Delete workflow", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Workflow deleted"), ...errors } } },
  "/workflows/{id}/run": { post: { ...secured, tags: ["Workflows"], summary: "Run workflow manually", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: json({ type: "object" }), responses: { "200": ok("Workflow execution"), ...errors } } },
  "/workflows/{id}/executions": { get: { ...secured, tags: ["Workflows"], summary: "List workflow executions", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Workflow executions"), ...errors } } },
  "/events": { get: { ...secured, tags: ["Events"], summary: "List internal event history", responses: { "200": ok("Events"), ...errors } } },
  "/events/{id}": { get: { ...secured, tags: ["Events"], summary: "Get an internal event", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Event"), ...errors } } },
  "/dlq": { get: { ...secured, tags: ["Events"], summary: "List dead letter queue entries", responses: { "200": ok("Dead letters"), ...errors } } },
  "/dlq/{id}/retry": { post: { ...secured, tags: ["Events"], summary: "Retry a dead letter delivery", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Delivery retry"), ...errors } } },
  "/webhooks": { get: { ...secured, tags: ["Webhooks"], summary: "List webhook endpoints", responses: { "200": ok("Webhooks"), ...errors } }, post: { ...secured, tags: ["Webhooks"], summary: "Create webhook endpoint", requestBody: json({ type: "object", required: ["url", "events"], properties: { url: { type: "string", format: "uri" }, events: { type: "array", items: { type: "string" } }, secret: { type: "string", writeOnly: true }, status: { type: "string", enum: ["active", "disabled"] }, retries: { type: "number" }, timeout_ms: { type: "number" } } }), responses: { "201": ok("Webhook created"), ...errors } } },
  "/webhooks/{id}": { get: { ...secured, tags: ["Webhooks"], summary: "Get webhook endpoint", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Webhook"), ...errors } }, patch: { ...secured, tags: ["Webhooks"], summary: "Update webhook endpoint", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: json({ type: "object" }), responses: { "200": ok("Webhook updated"), ...errors } }, delete: { ...secured, tags: ["Webhooks"], summary: "Delete webhook endpoint", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Webhook deleted"), ...errors } } },
  "/webhooks/{id}/test": { post: { ...secured, tags: ["Webhooks"], summary: "Send a signed test webhook", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Webhook test delivery"), ...errors } } },
  "/tasks": {
    post: {
      ...secured,
      tags: ["Tasks"],
      summary: "Create and execute a task",
      requestBody: json({ $ref: "#/components/schemas/TaskRequest" }),
      responses: { "200": ok("Task executed", { $ref: "#/components/schemas/RuntimeResponse" }), ...errors }
    }
  },
  "/tasks/batch": {
    post: {
      ...secured,
      tags: ["Tasks"],
      summary: "Execute multiple tasks",
      requestBody: json({ type: "object", properties: { items: { type: "array", items: { $ref: "#/components/schemas/TaskRequest" } } } }),
      responses: { "200": ok("Batch executed"), ...errors }
    }
  },
  "/executions": { get: { ...secured, tags: ["Executions"], summary: "List executions", responses: { "200": ok("Executions"), ...errors } } },
  "/executions/{id}": { get: { ...secured, tags: ["Executions"], summary: "Get execution package", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Execution"), ...errors } } },
  "/analytics": { get: { ...secured, tags: ["Analytics"], summary: "Get analytics", responses: { "200": ok("Analytics"), ...errors } } },
  "/learning": { get: { ...secured, tags: ["Learning"], summary: "Get learning report", responses: { "200": ok("Learning"), ...errors } } },
  "/feedback": { get: { ...secured, tags: ["Feedback"], summary: "List feedback", responses: { "200": ok("Feedback"), ...errors } }, post: { ...secured, tags: ["Feedback"], summary: "Create feedback", requestBody: json({ type: "object" }), responses: { "201": ok("Feedback created"), ...errors } } },
  "/strategy": { get: { ...secured, tags: ["Strategy"], summary: "Get latest strategy", responses: { "200": ok("Strategy"), ...errors } } },
  "/brands": { get: { ...secured, tags: ["Brands"], summary: "List brands", responses: { "200": ok("Brands", { type: "array", items: { $ref: "#/components/schemas/Brand" } }), ...errors } }, post: { ...secured, tags: ["Brands"], summary: "Create brand", requestBody: json({ $ref: "#/components/schemas/Brand" }), responses: { "201": ok("Brand created", { $ref: "#/components/schemas/Brand" }), ...errors } } },
  "/workspaces": { get: { ...secured, tags: ["Workspaces"], summary: "List workspaces", responses: { "200": ok("Workspaces"), ...errors } }, post: { ...secured, tags: ["Workspaces"], summary: "Create workspace", requestBody: json({ type: "object" }), responses: { "201": ok("Workspace created"), ...errors } } },
  "/workspaces/{id}": { get: { ...secured, tags: ["Workspaces"], summary: "Get workspace", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Workspace"), ...errors } }, patch: { ...secured, tags: ["Workspaces"], summary: "Update workspace", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: json({ type: "object" }), responses: { "200": ok("Workspace updated"), ...errors } } },
  "/workspaces/{id}/members": { get: { ...secured, tags: ["Workspaces"], summary: "List workspace members", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Members"), ...errors } }, post: { ...secured, tags: ["Workspaces"], summary: "Add workspace member", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: json({ type: "object" }), responses: { "201": ok("Member added"), ...errors } } },
  "/workspaces/{id}/members/{memberId}": { patch: { ...secured, tags: ["Workspaces"], summary: "Update workspace member", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }, { name: "memberId", in: "path", required: true, schema: { type: "string" } }], requestBody: json({ type: "object" }), responses: { "200": ok("Member updated"), ...errors } }, delete: { ...secured, tags: ["Workspaces"], summary: "Remove workspace member", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }, { name: "memberId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Member removed"), ...errors } } },
  "/workspaces/{id}/invitations": { post: { ...secured, tags: ["Workspaces"], summary: "Create workspace invitation", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: json({ type: "object" }), responses: { "201": ok("Invitation created"), ...errors } } },
  "/publications": { get: { ...secured, tags: ["Publications"], summary: "List publications", responses: { "200": ok("Publications"), ...errors } }, post: { ...secured, tags: ["Publications"], summary: "Create publication draft", requestBody: json({ type: "object" }), responses: { "201": ok("Draft created"), ...errors } } },
  "/providers": { get: { ...secured, tags: ["Providers"], summary: "List providers", responses: { "200": ok("Providers"), ...errors } } },
  "/scheduled-jobs": { get: { ...secured, tags: ["Scheduler"], summary: "List scheduled jobs", responses: { "200": ok("Jobs"), ...errors } }, post: { ...secured, tags: ["Scheduler"], summary: "Create scheduled job", requestBody: json({ type: "object" }), responses: { "201": ok("Job created"), ...errors } } },
  "/quality": { get: { ...secured, tags: ["Quality"], summary: "Get quality history", responses: { "200": ok("Quality"), ...errors } } },
  "/health": { get: { tags: ["Health"], summary: "Health check", responses: { "200": ok("Alive") } } },
  "/health/live": { get: { tags: ["Health"], summary: "Liveness check", responses: { "200": ok("Live") } } },
  "/health/ready": { get: { tags: ["Health"], summary: "Readiness check", responses: { "200": ok("Ready"), "503": ok("Not ready", errorRef) } } },
  "/health/details": { get: { ...secured, tags: ["Health"], summary: "Detailed operational health", responses: { "200": ok("Health details"), "503": ok("Degraded", errorRef), ...errors } } },
  "/version": { get: { tags: ["Operations"], summary: "Get Phoenix version information", responses: { "200": ok("Version", { type: "object", properties: { version: { type: "string" }, commit: { type: "string" }, build_date: { type: "string" }, node: { type: "string" }, environment: { type: "string" } } }) } } },
  "/metrics": { get: { ...secured, tags: ["Operations"], summary: "Metrics snapshot", responses: { "200": ok("Metrics"), ...errors } } },
  "/openapi.json": { get: { tags: ["Documentation"], summary: "OpenAPI JSON", responses: { "200": ok("OpenAPI") } } },
  "/openapi.yaml": { get: { tags: ["Documentation"], summary: "OpenAPI YAML", responses: { "200": { description: "OpenAPI YAML", content: { "application/yaml": { schema: { type: "string" } } } } } } },
  "/docs": { get: { tags: ["Documentation"], summary: "Interactive API docs", responses: { "200": { description: "HTML documentation" } } } }
} as const;
