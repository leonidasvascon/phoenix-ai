import { createHmac, timingSafeEqual } from "node:crypto";

export function signWebhookPayload(secret: string, timestamp: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

export function verifyWebhookSignature(input: {
  secret: string;
  timestamp: string;
  body: string;
  signature: string;
  toleranceSeconds?: number;
  now?: Date;
}): boolean {
  const toleranceSeconds = input.toleranceSeconds ?? Number(process.env.PHOENIX_WEBHOOK_REPLAY_WINDOW_SECONDS ?? 300);
  const now = input.now ?? new Date();
  const timestampMs = Date.parse(input.timestamp);
  if (Number.isNaN(timestampMs)) return false;
  if (Math.abs(now.getTime() - timestampMs) > toleranceSeconds * 1000) return false;

  const expected = signWebhookPayload(input.secret, input.timestamp, input.body);
  const actual = Buffer.from(input.signature);
  const expectedBuffer = Buffer.from(expected);
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}
