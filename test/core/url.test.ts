import { describe, expect, it } from "vitest";

import { hrefWith } from "@/core/url";

describe("hrefWith", () => {
  it("adds, replaces and removes params", () => {
    expect(
      hrefWith(
        "/pickups",
        { status: "pending", page: "3", q: "" },
        { page: null, sort: "-estimatedKg" },
      ),
    ).toBe("/pickups?status=pending&sort=-estimatedKg");
  });

  it("drops the ? when nothing is left", () => {
    expect(hrefWith("/pickups", { page: "2" }, { page: undefined })).toBe(
      "/pickups",
    );
  });
});
