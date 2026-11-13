import { describe, expect, it } from "vitest";

import {
  addDays,
  colomboDateKey,
  colomboInstant,
  colomboStartOfDay,
} from "@/core/time";

describe("Colombo time", () => {
  it("puts late-UTC instants on the next Colombo day", () => {
    expect(colomboDateKey("2026-11-06T18:29:00Z")).toBe("2026-11-06");
    expect(colomboDateKey("2026-11-06T18:30:00Z")).toBe("2026-11-07");
  });

  it("finds Colombo midnight", () => {
    expect(
      colomboStartOfDay(new Date("2026-11-07T04:30:00Z")).toISOString(),
    ).toBe("2026-11-06T18:30:00.000Z");
  });

  it("builds instants from local wall-clock times", () => {
    expect(colomboInstant("2026-11-07", 10).toISOString()).toBe(
      "2026-11-07T04:30:00.000Z",
    );
  });

  it("adds days across month ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-11-01", -14)).toBe("2026-10-18");
  });
});
