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
