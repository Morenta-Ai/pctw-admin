import type { ApiError, SerializedApiError } from "@/core/api/api-error";

/**
 * What a Server Action returns to the form that called it. Errors are plain
 * data, because class instances don't cross the Server Action boundary.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: SerializedApiError;
      fieldErrors?: Record<string, string>;
    };

export const actionOk = <T>(data: T): ActionResult<T> => ({ ok: true, data });

export function actionError<T>(error: ApiError): ActionResult<T> {
  const fieldErrors = error.fieldErrors;
  return {
    ok: false,
    error: error.toJSON(),
    ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
  };
}

/** A validation failure caught before calling the API. */
export function actionInvalid<T>(
  fieldErrors: Record<string, string>,
): ActionResult<T> {
  return {
    ok: false,
    error: {
      code: "VALIDATION_FAILED",
      message: Object.values(fieldErrors)[0] ?? "Check the form.",
      status: 422,
    },
    fieldErrors,
  };
}
