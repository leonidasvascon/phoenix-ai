import { paths } from "./paths.ts";
import { bearerAuth, phoenixApiKey, phoenixSessionCookie } from "./security.ts";
import { brandSchema, errorSchema, genericObjectSchema, runtimeResponseSchema, taskSchema } from "./schemas.ts";

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Phoenix API",
    version: "1.0.0-beta",
    description: "Phoenix AI API for tasks, brands, analytics, learning, publishing, quality and operations. Secrets and provider raw responses are intentionally excluded."
  },
  servers: [
    { url: "http://127.0.0.1:4000", description: "Local development" }
  ],
  paths,
  components: {
    securitySchemes: {
      BearerAuth: bearerAuth,
      PhoenixApiKey: phoenixApiKey,
      PhoenixSessionCookie: phoenixSessionCookie
    },
    schemas: {
      ErrorResponse: errorSchema,
      TaskRequest: taskSchema,
      RuntimeResponse: runtimeResponseSchema,
      Brand: brandSchema,
      GenericObject: genericObjectSchema
    }
  },
  tags: [
    { name: "Tasks" },
    { name: "Executions" },
    { name: "Analytics" },
    { name: "Learning" },
    { name: "Feedback" },
    { name: "Strategy" },
    { name: "Brands" },
    { name: "Identity" },
    { name: "Secrets" },
    { name: "Plugins" },
    { name: "Workflows" },
    { name: "Workspaces" },
    { name: "Publications" },
    { name: "Providers" },
    { name: "Scheduler" },
    { name: "Quality" },
    { name: "Health" },
    { name: "Operations" },
    { name: "Documentation" }
  ]
} as const;
