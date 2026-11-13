import { describe, expect, it } from "vitest";

import {
  assignmentSchema,
  offerInputSchema,
} from "@/features/assignments/data/models";

import { requestSample, responseSample } from "./contract-samples";

describe("assignments contract", () => {
  it("parses the offer request and response", () => {
    expect(
      offerInputSchema.safeParse(
        requestSample("POST /admin/pickups/{id}/assignments"),
      ).success,
    ).toBe(true);
    expect(
      assignmentSchema.parse(
        responseSample("POST /admin/pickups/{id}/assignments"),
      ).status,
    ).toBe("offered");
  });
});
