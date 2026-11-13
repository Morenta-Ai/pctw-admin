import type { z } from "zod";

import { ApiError, ClientErrorCode } from "@/core/api/api-error";

type Query = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions<S extends z.ZodType> = {
  query?: Query;
  body?: unknown;
  /** Parses the response. A mismatch is a BAD_RESPONSE, not a crash later on. */
  schema?: S;
  signal?: AbortSignal;
};

export type ApiClientOptions = {
  /** Includes `/api/v1`. */
  baseUrl: string;
  /** Called per request, so a refreshed token is picked up straight away. */
  getAccessToken?: () => Promise<string | undefined> | string | undefined;
  timeoutMs?: number;
  fetch?: typeof fetch;
};

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Thin fetch wrapper for the .NET API. Speaks the contract's conventions:
 * JSON bodies, bearer auth and `{ code, message, details }` errors.
 * Only sources use it; pages and components never call it directly.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly options: ApiClientOptions;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.options = options;
  }

  get<S extends z.ZodType = z.ZodUnknown>(
    path: string,
    options?: RequestOptions<S>,
  ) {
    return this.request("GET", path, options);
  }

  post<S extends z.ZodType = z.ZodUnknown>(
    path: string,
    options?: RequestOptions<S>,
  ) {
    return this.request("POST", path, options);
  }

  put<S extends z.ZodType = z.ZodUnknown>(
    path: string,
    options?: RequestOptions<S>,
  ) {
    return this.request("PUT", path, options);
  }

  patch<S extends z.ZodType = z.ZodUnknown>(
    path: string,
    options?: RequestOptions<S>,
  ) {
    return this.request("PATCH", path, options);
  }

  delete<S extends z.ZodType = z.ZodUnknown>(
    path: string,
    options?: RequestOptions<S>,
  ) {
    return this.request("DELETE", path, options);
  }

  /** `multipart/form-data`, such as a file upload. */
  async postForm<S extends z.ZodType>(
    path: string,
    form: FormData,
    schema: S,
  ): Promise<z.infer<S>> {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = await this.options.getAccessToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    let response: Response;
    try {
      response = await (this.options.fetch ?? fetch)(this.url(path), {
        method: "POST",
        headers,
        body: form,
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 60_000),
        cache: "no-store",
      });
    } catch (error) {
      throw ApiError.fromUnknown(error);
    }
    if (!response.ok) throw await toApiError(response);
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
      throw new ApiError({
        code: ClientErrorCode.badResponse,
        message: `POST ${path} returned an unexpected shape.`,
        status: response.status,
      });
    }
    return parsed.data;
  }

  async request<S extends z.ZodType>(
    method: Method,
    path: string,
    { query, body, schema, signal }: RequestOptions<S> = {},
  ): Promise<z.infer<S>> {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = await this.options.getAccessToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const timeout = AbortSignal.timeout(this.options.timeoutMs ?? 15_000);
    const fetchImpl = this.options.fetch ?? fetch;

    let response: Response;
    try {
      response = await fetchImpl(this.url(path, query), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        cache: "no-store",
      });
    } catch (error) {
      throw ApiError.fromUnknown(error);
    }

    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as z.infer<S>;

    let json: unknown;
    try {
      json = await response.json();
    } catch (error) {
      throw new ApiError({
        code: ClientErrorCode.badResponse,
        message: `${method} ${path} returned a body that isn't JSON.`,
        status: response.status,
        cause: error,
      });
    }

    if (!schema) return json as z.infer<S>;
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new ApiError({
        code: ClientErrorCode.badResponse,
        message: `${method} ${path} returned an unexpected shape: ${parsed.error.message}`,
        status: response.status,
        cause: parsed.error,
      });
    }
    return parsed.data;
  }

  private url(path: string, query?: Query): string {
    const url = new URL(`${this.baseUrl}/${path.replace(/^\/+/, "")}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (isErrorBody(body)) {
    return new ApiError({
      code: body.code,
      message: body.message ?? response.statusText,
      status: response.status,
      details: body.details,
    });
  }
  return new ApiError({
    code: `HTTP_${response.status}`,
    message: response.statusText || `Request failed with ${response.status}.`,
    status: response.status,
  });
}

function isErrorBody(body: unknown): body is {
  code: string;
  message?: string;
  details?: Record<string, unknown>;
} {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { code?: unknown }).code === "string"
  );
}
