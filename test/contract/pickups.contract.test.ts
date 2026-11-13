import { describe, expect, it } from "vitest";

import {
  cancelPickupInputSchema,
  pickupDetailSchema,
  pickupPageSchema,
} from "@/features/pickups/data/models";

import { requestSample, responseSample } from "./contract-samples";

describe("pickups contract", () => {
  it("parses the list sample", () => {
    const page = pickupPageSchema.parse(
      responseSample(
        "GET /admin/pickups?status=pending&date=2026-11-07&source=app&q=wella&page=1&pageSize=25&sort=-createdAt",
      ),
    );
    expect(page.items[0]?.id).toBe("RT-24841");
  });

  it("parses the detail sample", () => {
    const pickup = pickupDetailSchema.parse(
      responseSample("GET /admin/pickups/{id}"),
    );
    expect(pickup.collector?.code).toBe("COL-0457");
  });

  it("parses the cancel request", () => {
    expect(
      cancelPickupInputSchema.safeParse(
        requestSample("POST /admin/pickups/{id}/cancel"),
      ).success,
    ).toBe(true);
  });
});
