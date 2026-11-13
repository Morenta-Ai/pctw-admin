import { describe, expect, it } from "vitest";

import {
  authTokensSchema,
  loginInputSchema,
} from "@/features/auth/data/models";

import { requestSample, responseSample } from "./contract-samples";

describe("auth contract", () => {
  it("parses the login request and response samples", () => {
    expect(
      loginInputSchema.safeParse(requestSample("POST /admin/auth/login"))
        .success,
    ).toBe(true);

    const response = authTokensSchema.parse(
      responseSample("POST /admin/auth/login"),
    );
    expect(response.staff.role).toBe("admin");
  });
});
