import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type EncryptedPayload = {
  algorithm: "aes-256-gcm";
  keyId: string;
  nonce: string;
  authTag: string;
  ciphertext: string;
};

export function encryptSecret(plaintext: string, keyId = process.env.PHOENIX_SECRETS_KEY_ID ?? "local-v1"): EncryptedPayload {
  const key = masterKey();
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  key.fill(0);
  return {
    algorithm: "aes-256-gcm",
    keyId,
    nonce: nonce.toString("base64url"),
    authTag: authTag.toString("base64url"),
    ciphertext: ciphertext.toString("base64url")
  };
}

export function decryptSecret(payload: EncryptedPayload): string {
  if (payload.algorithm !== "aes-256-gcm") throw new Error("Unsupported secret encryption algorithm.");
  const key = masterKey();
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(payload.nonce, "base64url"));
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64url"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64url")), decipher.final()]);
    return plaintext.toString("utf8");
  } finally {
    key.fill(0);
  }
}

export function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function secureEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function masterKey(): Buffer {
  const raw = process.env.PHOENIX_SECRETS_MASTER_KEY;
  if (!raw) throw new Error("PHOENIX_SECRETS_MASTER_KEY is required for encrypted_file secrets.");
  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  try {
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length === 32) return decoded;
  } catch {
    // Fall through to deterministic derivation for local development compatibility.
  }
  return createHash("sha256").update(raw).digest();
}
