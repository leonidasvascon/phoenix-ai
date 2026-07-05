export type RetryPolicy = {
  maxAttempts: number;
  minScore: number;
};

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 2,
  minScore: 90
};

export function shouldRetry(attempt: number, score: number, policy = defaultRetryPolicy): boolean {
  return score < policy.minScore && attempt < policy.maxAttempts;
}

