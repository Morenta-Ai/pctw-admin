import { describe, expect, it } from "vitest";

import { ApiError } from "@/core/api/api-error";
import { guard, unwrap } from "@/core/result";

describe("guard", () => {
  it("wraps a value", async () => {
    await expect(guard(async () => 42)).resolves.toEqual({
      ok: true,
      data: 42,
    });
  });

  it("turns a throw into a failed result with an ApiError", async () => {
    const result = await guard(async () => {
      throw new Error("boom");
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ApiError);
      expect(result.error.code).toBe("UNKNOWN");
    }
  });

  it("keeps an ApiError as it is", async () => {
    const original = new ApiError({
      code: "NOT_FOUND",
      message: "x",
      status: 404,
    });

    const result = await guard(async () => {
      throw original;
    });

    expect(result).toEqual({ ok: false, error: original });
    expect(() => unwrap(result)).toThrow(original);
  });
});
