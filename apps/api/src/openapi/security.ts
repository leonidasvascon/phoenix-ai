export const bearerAuth = {
  type: "http",
  scheme: "bearer"
} as const;

export const phoenixApiKey = {
  type: "apiKey",
  in: "header",
  name: "X-Phoenix-Api-Key"
} as const;

export const protectedSecurity = [
  { BearerAuth: [] },
  { PhoenixApiKey: [] }
];
