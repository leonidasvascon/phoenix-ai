export type PhoenixEnvMode = "development" | "production" | "test";

export type PhoenixEnvSpec = {
  name: string;
  requiredIn: PhoenixEnvMode[];
  defaultValue?: string;
  sensitive?: boolean;
  description: string;
};

export const phoenixEnvSchema: PhoenixEnvSpec[] = [
  { name: "PHOENIX_API_KEY", requiredIn: ["production"], sensitive: true, description: "API key required for protected API endpoints." },
  { name: "PHOENIX_API_PORT", requiredIn: [], defaultValue: "4000", description: "Phoenix API HTTP port." },
  { name: "PHOENIX_STUDIO_ORIGIN", requiredIn: [], defaultValue: "http://127.0.0.1:3000", description: "Studio origin allowed by CORS." },
  { name: "PHOENIX_CORS_ORIGIN", requiredIn: [], description: "Explicit CORS origin override." },
  { name: "PHOENIX_PROVIDER", requiredIn: [], defaultValue: "mock", description: "Runtime LLM provider." },
  { name: "PHOENIX_RATE_LIMIT_ENABLED", requiredIn: [], defaultValue: "true", description: "Enables in-memory API rate limiting." },
  { name: "PHOENIX_RATE_LIMIT_WINDOW_MS", requiredIn: [], defaultValue: "60000", description: "Rate limit window." },
  { name: "PHOENIX_RATE_LIMIT_MAX", requiredIn: [], defaultValue: "120", description: "Maximum requests per client per window." },
  { name: "PHOENIX_ENV", requiredIn: [], defaultValue: "development", description: "Phoenix runtime environment label." },
  { name: "PHOENIX_COMMIT_SHA", requiredIn: [], description: "Build commit SHA." },
  { name: "PHOENIX_BUILD_DATE", requiredIn: [], description: "Build timestamp." }
];
