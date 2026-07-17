export function toYaml(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]\n";
    return value.map((item) => `${pad}- ${formatYamlValue(item, indent + 1).trimStart()}`).join("");
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}\n";
    return entries.map(([key, item]) => {
      if (item && typeof item === "object") {
        return `${pad}${quoteKey(key)}:\n${toYaml(item, indent + 1)}`;
      }
      return `${pad}${quoteKey(key)}: ${formatScalar(item)}\n`;
    }).join("");
  }

  return `${pad}${formatScalar(value)}\n`;
}

function formatYamlValue(value: unknown, indent: number): string {
  if (value && typeof value === "object") {
    return `\n${toYaml(value, indent)}`;
  }
  return `${formatScalar(value)}\n`;
}

function quoteKey(key: string): string {
  return /^[a-zA-Z0-9_.-]+$/.test(key) ? key : JSON.stringify(key);
}

function formatScalar(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string" && /^[a-zA-Z0-9_./:-]+$/.test(value)) return value;
  return JSON.stringify(value ?? "");
}
