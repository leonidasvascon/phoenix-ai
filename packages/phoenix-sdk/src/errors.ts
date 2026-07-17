import type { PhoenixErrorPayload } from "./types.ts";

export class PhoenixApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly traceId?: string;

  constructor(payload: PhoenixErrorPayload) {
    super(payload.error.message);
    this.code = payload.error.code;
    this.status = payload.error.status;
    this.traceId = payload.error.trace_id;
  }
}
