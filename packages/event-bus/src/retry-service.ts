const retryDelaysMs = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  6 * 60 * 60_000
];

export function nextRetryAt(attempts: number, from = new Date()): string | null {
  const delay = retryDelaysMs[attempts - 1];
  if (delay === undefined) return null;
  return new Date(from.getTime() + delay).toISOString();
}

export function maxRetryAttempts(): number {
  return retryDelaysMs.length;
}
