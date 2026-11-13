import { describe, expect, it } from "vitest";

import { DashboardMockSource } from "@/features/dashboard/data/dashboard-mock-source";
import { dashboardSchema } from "@/features/dashboard/data/models";
import { resetMockWorld } from "@/mock/mock-world";

// 14:30 in Colombo, so all of today's seeded events are in the past.
const now = new Date("2026-11-07T09:00:00Z");

async function dashboard() {
  const source = new DashboardMockSource(resetMockWorld(now), () => now);
  return dashboardSchema.parse(await source.getDashboard());
}

describe("dashboard mock source", () => {
  it("counts today's pickups by status", async () => {
    const { date, pickupsToday } = await dashboard();

    expect(date).toBe("2026-11-07");
    expect(pickupsToday).toMatchObject({
      pending: 5,
      assigned: 1,
      enRoute: 1,
      arrived: 1,
      collected: 5,
      deliveredToHub: 1,
      cancelled: 1,
      total: 15,
    });
  });

  it("flags pending pickups waiting over 30 minutes", async () => {
    // RT-24822 (55 min), RT-24830 (35 min) and RT-24841 (42 min).
    expect((await dashboard()).unassignedOverdue).toBe(3);
  });

  it("totals today's weighed kg and payouts in whole cents", async () => {
    const result = await dashboard();

    // 6.2 + 7.1 + 7.2 + 9.8 + 14.3 + 3.4
    expect(result.collectedTodayKg).toBe(48);
    expect(result.customerPayoutsTodayCents).toBe(576_000);
    expect(result.collectorPayoutsTodayCents).toBe(192_000);
  });

  it("returns 14 days ending today and the newest activity first", async () => {
    const { daily, recentActivity } = await dashboard();

    expect(daily).toHaveLength(14);
    expect(daily.at(-1)?.date).toBe("2026-11-07");
    expect(daily[0]?.date).toBe("2026-10-25");
    expect(recentActivity).toHaveLength(10);
    const times = recentActivity.map((a) => a.occurredAt);
    expect([...times].sort().reverse()).toEqual(times);
  });

  it("counts online collectors and open orders", async () => {
    const result = await dashboard();

    expect(result.collectors).toEqual({ online: 7, active: 11 });
    expect(result.orders.placedToday).toBe(3);
    expect(result.orders.open).toBeGreaterThanOrEqual(3);
  });
});
