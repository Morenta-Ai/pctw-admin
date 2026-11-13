import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiClient } from "@/core/api/api-client";
import { ApiError, errorMessage } from "@/core/api/api-error";

function clientReturning(response: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  const client = new ApiClient({
    baseUrl: "https://api.test/api/v1/",
    getAccessToken: () => "token-123",
    fetch: fetchMock,
  });
  return { client, fetchMock };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("ApiClient", () => {
  it("sends bearer auth, JSON and query params, and parses with the schema", async () => {
    const { client, fetchMock } = clientReturning(json({ items: [1, 2] }));

    const data = await client.get("/pickups", {
      query: { status: "pending", cursor: undefined, page: 2 },
      schema: z.object({ items: z.array(z.number()) }),
    });

    expect(data).toEqual({ items: [1, 2] });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.test/api/v1/pickups?status=pending&page=2");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer token-123",
    );
  });

  it("serialises the body for writes", async () => {
    const { client, fetchMock } = clientReturning(
      new Response(null, { status: 204 }),
    );

    await expect(
      client.post("rates", { body: { pricePerKgCents: 12_000 } }),
    ).resolves.toBeUndefined();

    const init = fetchMock.mock.calls[0]![1]!;
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"pricePerKgCents":12000}');
    expect(new Headers(init.headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("maps the contract's error body to ApiError", async () => {
    const { client } = clientReturning(
      json(
        {
          code: "ASSIGNMENT_EXPIRED",
          message: "The collector didn't answer in time.",
          details: { pickupId: "RT-24841" },
        },
        409,
      ),
    );

    const error = await client.post("assignments").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: "ASSIGNMENT_EXPIRED",
      status: 409,
      details: { pickupId: "RT-24841" },
    });
    expect((error as ApiError).isConflict).toBe(true);
  });

  it("falls back to HTTP_<status> when the body isn't the error shape", async () => {
    const { client } = clientReturning(
      new Response("oops", { status: 502, statusText: "Bad Gateway" }),
    );

    const error = (await client.get("me").catch((e: unknown) => e)) as ApiError;

    expect(error.code).toBe("HTTP_502");
    expect(errorMessage(error)).toBe(
      "The server ran into a problem. Try again.",
    );
  });

  it("reports a schema mismatch as BAD_RESPONSE", async () => {
    const { client } = clientReturning(json({ items: "nope" }));

    const error = (await client
      .get("pickups", { schema: z.object({ items: z.array(z.number()) }) })
      .catch((e: unknown) => e)) as ApiError;

    expect(error.code).toBe("BAD_RESPONSE");
  });

  it("reports a failed connection as NETWORK_ERROR", async () => {
    const { client } = clientReturning(new TypeError("fetch failed"));

    const error = (await client.get("me").catch((e: unknown) => e)) as ApiError;

    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.status).toBe(0);
  });

  it("exposes 422 field errors", () => {
    const error = new ApiError({
      code: "VALIDATION_FAILED",
      message: "Invalid",
      status: 422,
      details: { pricePerKgCents: "Must be above zero.", extra: 3 },
    });

    expect(error.fieldErrors).toEqual({
      pricePerKgCents: "Must be above zero.",
    });
  });
});
