import { describe, expect, it } from "vitest";

import { paginate } from "@/core/paged";

describe("paginate", () => {
  const items = Array.from({ length: 60 }, (_, i) => i);

  it("slices the requested page", () => {
    expect(paginate(items, 2, 25)).toMatchObject({
      items: items.slice(25, 50),
      page: 2,
      totalCount: 60,
    });
  });

  it("clamps the page to the last one and the size to 100", () => {
    expect(paginate(items, 9, 25).page).toBe(3);
    expect(paginate(items, 1, 500).pageSize).toBe(100);
    expect(paginate([], 4).page).toBe(1);
  });
});
