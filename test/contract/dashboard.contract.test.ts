import { describe, expect, it } from "vitest";

import { dashboardSchema } from "@/features/dashboard/data/models";

import { responseSample } from "./contract-samples";

describe("dashboard contract", () => {
  it("parses the GET /admin/dashboard sample", () => {
    const sample = dashboardSchema.parse(
      responseSample("GET /admin/dashboard"),
    );
    expect(sample.recentActivity[0]?.type).toBe("pickupRequested");
  });
});
