export const bearerAuth = {
  type: "http",
  scheme: "bearer"
} as const;

export const phoenixApiKey = {
  type: "apiKey",
  in: "header",
  name: "X-Phoenix-Api-Key"
} as const;

export const phoenixSessionCookie = {
  type: "apiKey",
  in: "cookie",
  name: "phoenix_session"
} as const;

export const protectedSecurity = [
  { BearerAuth: [] },
  { PhoenixApiKey: [] },
  { PhoenixSessionCookie: [] }
];
