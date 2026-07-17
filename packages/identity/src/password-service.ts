import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  validatePassword(password);
  const salt = randomBytes(16).toString("base64url");
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return `scrypt$v1$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [, version, salt, stored] = passwordHash.split("$");
  if (version !== "v1" || !salt || !stored) return false;
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  const expected = Buffer.from(stored, "base64url");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function validatePassword(password: string): void {
  if (password.length < Number(process.env.PHOENIX_PASSWORD_MIN_LENGTH ?? 10)) {
    throw new Error("Password is too short.");
  }
}
