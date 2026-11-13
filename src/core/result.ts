import { ApiError } from "@/core/api/api-error";

/** What every repository returns. Repositories never throw to the UI. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

export const fail = <T = never>(error: ApiError): Result<T> => ({
  ok: false,
  error,
});

/** Runs a source call and turns anything it throws into a failed Result. */
export async function guard<T>(call: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await call());
  } catch (error) {
    return fail(ApiError.fromUnknown(error));
  }
}

/** Data from a Result, or throws its error. For pages with an error boundary. */
export function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.data;
  throw result.error;
}
