/**
 * Every failure the UI can see. Server errors keep the API's stable `code`
 * (see docs/API_CONTRACT.md); client-side failures use the codes below.
 */
export const ClientErrorCode = {
  network: "NETWORK_ERROR",
  timeout: "TIMEOUT",
  badResponse: "BAD_RESPONSE",
  unknown: "UNKNOWN",
} as const;

export type ApiErrorDetails = Record<string, unknown>;

export class ApiError extends Error {
  readonly code: string;
  /** HTTP status, or 0 when the request never got a response. */
  readonly status: number;
  readonly details?: ApiErrorDetails;

  constructor(options: {
    code: string;
    message: string;
    status?: number;
    details?: ApiErrorDetails;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status ?? 0;
    this.details = options.details;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  /** Field errors from a 422, as `{ field: message }`. */
  get fieldErrors(): Record<string, string> {
    if (this.status !== 422 || !this.details) return {};
    return Object.fromEntries(
      Object.entries(this.details).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  }

  /** Plain data that survives the Server Action boundary. */
  toJSON(): SerializedApiError {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
    };
  }

  static fromUnknown(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof Error && error.name === "TimeoutError") {
      return new ApiError({
        code: ClientErrorCode.timeout,
        message: "The server took too long to respond.",
        cause: error,
      });
    }
    if (error instanceof TypeError) {
      return new ApiError({
        code: ClientErrorCode.network,
        message: "Couldn't reach the server.",
        cause: error,
      });
    }
    return new ApiError({
      code: ClientErrorCode.unknown,
      message: error instanceof Error ? error.message : "Something went wrong.",
      cause: error,
    });
  }
}

export type SerializedApiError = {
  code: string;
  message: string;
  status: number;
  details?: ApiErrorDetails;
};

/** Text for staff. Recognised codes get a friendly line; others use the server's message. */
export function errorMessage(error: SerializedApiError | ApiError): string {
  switch (error.code) {
    case ClientErrorCode.network:
      return "Couldn't reach the ReThread server. Check your connection and try again.";
    case ClientErrorCode.timeout:
      return "The server took too long to respond. Try again.";
    case ClientErrorCode.badResponse:
      return "The server sent something unexpected. Try again, or tell the tech team.";
    default:
      if (error.status === 401) return "Your session has ended. Sign in again.";
      if (error.status === 403) return "You don't have access to do that.";
      if (error.status >= 500)
        return "The server ran into a problem. Try again.";
      return error.message || "Something went wrong.";
  }
}
