import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Typed application error carrying an HTTP status and a stable machine code. The global `onError`
 * handler maps it to a safe JSON body. Mirrors the `CustomError` convention from the Agents
 * backend (message / status / code), minus the Sentry/DI machinery this single-domain app doesn't
 * need. (status is `ContentfulStatusCode` since every error here has a JSON body.)
 */
export class CustomError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: string;

  constructor(message: string, status: ContentfulStatusCode, code: string) {
    super(message);
    this.name = "CustomError";
    this.status = status;
    this.code = code;
  }
}
