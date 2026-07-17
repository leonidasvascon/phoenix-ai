export const errorSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message", "status"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        status: { type: "integer" },
        trace_id: { type: "string" }
      }
    }
  }
} as const;

export const taskSchema = {
  type: "object",
  required: ["brand", "theme", "objective", "platform", "format"],
  properties: {
    brand: { type: "string" },
    theme: { type: "string" },
    objective: { type: "string" },
    platform: { type: "string", default: "instagram" },
    format: { type: "string", enum: ["reel", "carousel", "story"] },
    language: { type: "string", default: "pt-BR" }
  }
} as const;

export const runtimeResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    execution_id: { type: "string" },
    score: { type: "number" },
    execution: { type: "object" },
    output: { type: "object" },
    media_package: { type: "object" }
  }
} as const;

export const brandSchema = {
  type: "object",
  properties: {
    version: { oneOf: [{ type: "string" }, { type: "number" }] },
    brand: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" }
      }
    },
    purpose: { type: "string" }
  }
} as const;

export const genericObjectSchema = {
  type: "object",
  additionalProperties: true
} as const;
