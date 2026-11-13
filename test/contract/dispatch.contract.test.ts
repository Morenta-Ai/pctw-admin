import { describe, expect, it } from "vitest";

import { dispatchSchema } from "@/features/dispatch/data/models";

import { responseSample } from "./contract-samples";

describe("dispatch contract", () => {
  it("parses the GET /admin/dispatch sample", () => {
    const sample = dispatchSchema.parse(responseSample("GET /admin/dispatch"));
    expect(sample.collectors[0]?.activePickupId).toBe("RT-24817");
  });
});
