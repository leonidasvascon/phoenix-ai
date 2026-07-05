export function parseJsonOutput(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== "string") {
    throw new Error("Agent output is not JSON or text.");
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced?.[1] ?? value.match(/\{[\s\S]*\}/)?.[0];

    if (!candidate) {
      throw new Error("Agent output does not contain a JSON object.");
    }

    return JSON.parse(candidate) as Record<string, unknown>;
  }
}

