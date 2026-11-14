import { describe, expect, it } from "vitest";

import {
  donationProjectInputSchema,
  donationProjectListSchema,
} from "@/features/donations/data/models";
import {
  payInputSchema,
  redemptionPageSchema,
  rejectInputSchema,
} from "@/features/redemptions/data/models";

import { requestSample, responseSample } from "./contract-samples";

describe("donations and redemptions contract", () => {
  it("parses the samples", () => {
    donationProjectListSchema.parse(
      responseSample("GET /admin/donation-projects"),
    );
    expect(
      donationProjectInputSchema.safeParse(
        requestSample("POST /admin/donation-projects"),
      ).success,
    ).toBe(true);
    expect(
      redemptionPageSchema.parse(
        responseSample(
          "GET /admin/redemptions?type=cash&status=pending&q=perera&page=1&pageSize=25",
        ),
      ).items[0]?.bank?.accountNumber,
    ).toBe("8001234821");
    expect(
      payInputSchema.safeParse(
        requestSample("POST /admin/redemptions/{id}/pay"),
      ).success,
    ).toBe(true);
    expect(
      rejectInputSchema.safeParse(
        requestSample("POST /admin/redemptions/{id}/reject"),
      ).success,
    ).toBe(true);
  });
});
