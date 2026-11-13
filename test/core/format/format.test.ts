import { describe, expect, it } from "vitest";

import {
  centsToRupeesInput,
  formatAmount,
  formatDateTime,
  formatLkMobile,
  formatMoney,
  formatRelative,
  formatSignedMoney,
  formatTime,
  formatTimeWindow,
  formatWeight,
  rupeesToCents,
} from "@/core/format/format";

describe("money", () => {
  it("formats cents as rupees with grouping", () => {
    expect(formatMoney(123_400)).toBe("Rs. 1,234.00");
    expect(formatMoney(88_800, { decimals: false })).toBe("Rs. 888");
    expect(formatMoney(88_850, { decimals: false })).toBe("Rs. 888.50");
    expect(formatMoney(5)).toBe("Rs. 0.05");
  });

  it("uses the minus sign for negatives", () => {
    expect(formatMoney(-50_000)).toBe("− Rs. 500.00");
    expect(formatSignedMoney(114_000)).toBe("+ Rs. 1,140.00");
    expect(formatSignedMoney(-50_000)).toBe("− Rs. 500.00");
  });

  it("rejects fractional cents", () => {
    expect(() => formatAmount(10.5)).toThrow(RangeError);
  });

  it("converts typed rupees to cents without floating point drift", () => {
    expect(rupeesToCents("120")).toBe(12_000);
    expect(rupeesToCents("1,234.5")).toBe(123_450);
    expect(rupeesToCents("Rs. 0.07")).toBe(7);
    expect(rupeesToCents("19.99")).toBe(1_999);
    expect(rupeesToCents("1.234")).toBeNull();
    expect(rupeesToCents("abc")).toBeNull();
    expect(rupeesToCents("")).toBeNull();
  });

  it("round-trips cents through the input format", () => {
    expect(centsToRupeesInput(123_450)).toBe("1234.50");
    expect(rupeesToCents(centsToRupeesInput(1_999))).toBe(1_999);
  });
});

describe("other values", () => {
  it("formats weight and mobile numbers", () => {
    expect(formatWeight(7.4)).toBe("7.40 kg");
    expect(formatLkMobile("+94771234567")).toBe("+94 77 123 4567");
    expect(formatLkMobile("0771234567")).toBe("0771234567");
  });
});

describe("dates", () => {
  // 04:30 UTC is 10:00 in Colombo (UTC+05:30).
  const start = "2026-11-03T04:30:00Z";
  const end = "2026-11-03T05:30:00Z";

  it("shows Colombo time, 24-hour", () => {
    expect(formatTime(start)).toBe("10:00");
    expect(formatTime("2026-11-03T13:45:00Z")).toBe("19:15");
    expect(formatTimeWindow(start, end)).toBe("10:00–11:00");
    expect(formatDateTime(start)).toBe("Tue 3 Nov, 10:00");
  });

  it("describes recent times relatively", () => {
    const now = new Date("2026-11-03T05:00:00Z");
    expect(formatRelative("2026-11-03T04:59:30Z", now)).toBe("just now");
    expect(formatRelative("2026-11-03T04:55:00Z", now)).toBe("5 min ago");
    expect(formatRelative("2026-11-03T02:00:00Z", now)).toBe("3 h ago");
    expect(formatRelative("2026-11-01T02:00:00Z", now)).toBe("Sun 1 Nov");
  });
});
