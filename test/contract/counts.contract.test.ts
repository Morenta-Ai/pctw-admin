import { describe, expect, it } from "vitest";

import { CountsMockSource } from "@/features/counts/data/counts-repository";
import { countsSchema } from "@/features/counts/data/models";
import { resetMockWorld } from "@/mock/mock-world";

import { responseSample } from "./contract-samples";

describe("counts", () => {
  it("parses the contract sample", () => {
    expect(
      countsSchema.parse(responseSample("GET /admin/counts")).newOrders,
    ).toBe(2);
  });

  it("counts new orders and waiting pickups in the mock", async () => {
    const now = new Date("2026-11-07T06:00:00Z");
    const counts = await new CountsMockSource(
      resetMockWorld(now),
      () => now,
    ).getCounts();
    expect(counts).toEqual({ newOrders: 2, waitingPickups: 5 });
  });
});
