import { describe, expect, it } from "vitest";

import { pickupQueryFromParams } from "@/features/pickups/pickup-query";

// 00:30 on 8 Nov in Colombo.
const now = new Date("2026-11-07T19:00:00Z");

describe("pickupQueryFromParams", () => {
  it("resolves today and yesterday in Colombo time", () => {
    expect(pickupQueryFromParams({ date: "today" }, now).date).toBe(
      "2026-11-08",
    );
    expect(pickupQueryFromParams({ date: "yesterday" }, now).date).toBe(
      "2026-11-07",
    );
  });

  it("keeps valid filters and drops invalid ones", () => {
    expect(
      pickupQueryFromParams(
        {
          status: "pending",
          source: "nope",
          date: "07/11/2026",
          page: "2",
          sort: "-estimatedKg",
          q: "  wella ",
        },
        now,
      ),
    ).toEqual({
      status: "pending",
      source: undefined,
      date: undefined,
      page: 2,
      sort: "-estimatedKg",
      q: "wella",
    });
  });
});
