import { describe, expect, it } from "vitest";

import {
  multipliersInputSchema,
  multipliersSchema,
  newRatesInputSchema,
  ratesSchema,
} from "@/features/rates/data/models";

import { requestSample, responseSample } from "./contract-samples";

describe("rates contract", () => {
  it("parses the rates and multipliers samples", () => {
    expect(
      ratesSchema.parse(responseSample("GET /admin/rates")).current.id,
    ).toBe("rate_3");
    expect(
      newRatesInputSchema.safeParse(requestSample("POST /admin/rates")).success,
    ).toBe(true);
    expect(
      multipliersSchema.parse(responseSample("GET /admin/impact-multipliers"))
        .items,
    ).toHaveLength(8);
    expect(
      multipliersInputSchema.safeParse(
        requestSample("PUT /admin/impact-multipliers"),
      ).success,
    ).toBe(true);
  });
});
