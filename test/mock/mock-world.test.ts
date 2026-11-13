import { describe, expect, it } from "vitest";

import { getMockWorld, resetMockWorld } from "@/mock/mock-world";

describe("MockWorld", () => {
  it("is one shared instance until reset", () => {
    const first = getMockWorld();

    expect(getMockWorld()).toBe(first);
    expect(resetMockWorld()).not.toBe(first);
  });

  it("hands out unique ids", () => {
    const world = resetMockWorld();

    expect(world.nextId("ord")).toBe("ord_1");
    expect(world.nextId("ord")).toBe("ord_2");
  });
});
