import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createOpaqueToken(prefix = "tok"): string {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(token: string, hash: string): boolean {
  const provided = Buffer.from(hashToken(token));
  const expected = Buffer.from(hash);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
