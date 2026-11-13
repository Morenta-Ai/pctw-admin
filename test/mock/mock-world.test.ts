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

describe("seed data", () => {
  const now = new Date("2026-11-07T06:00:00Z"); // 11:30 in Colombo
  const world = resetMockWorld(now);

  it("uses the IDs the user and collector apps use", () => {
    const ids = world.pickups.map((p) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining(["RT-24817", "RT-24822", "RT-24841"]),
    );
    expect(world.collectors.map((c) => c.code)).toContain("COL-0457");
    expect(world.collector("col_457")?.firstName).toBe("Ruwan");
  });

  it("is the same on every start", () => {
    const again = resetMockWorld(now);
    expect(again.pickups).toEqual(world.pickups);
    expect(again.orders).toEqual(world.orders);
  });

  it("has unique pickup and order IDs", () => {
    expect(new Set(world.pickups.map((p) => p.id)).size).toBe(
      world.pickups.length,
    );
    expect(new Set(world.orders.map((o) => o.id)).size).toBe(
      world.orders.length,
    );
  });

  it("keeps payouts in whole cents from the weighed kg", () => {
    for (const pickup of world.pickups) {
      if (pickup.actualWeightKg === null) {
        expect(pickup.customerPayoutCents).toBeNull();
      } else {
        expect(Number.isInteger(pickup.customerPayoutCents)).toBe(true);
        expect(pickup.customerPayoutCents).toBe(
          Math.round(pickup.actualWeightKg * 12_000),
        );
      }
    }
  });

  it("gives each pickup a timeline ending in its status", () => {
    for (const pickup of world.pickups) {
      expect(pickup.timeline.at(-1)?.status).toBe(pickup.status);
    }
  });

  it("carries the collector app's 20.5 kg load for Ruwan", () => {
    const load = world.pickups.filter(
      (p) => p.collectorId === "col_457" && p.status === "collected",
    );
    const kg = load.reduce((sum, p) => sum + (p.actualWeightKg ?? 0), 0);
    expect(Math.round(kg * 100) / 100).toBe(20.5);
  });

  it("totals orders correctly", () => {
    for (const order of world.orders) {
      const subtotal = order.items.reduce(
        (sum, item) => sum + item.unitPriceCents * item.quantity,
        0,
      );
      expect(order.subtotalCents).toBe(subtotal);
      expect(order.totalCents).toBe(subtotal + order.transportChargeCents);
    }
  });
});
