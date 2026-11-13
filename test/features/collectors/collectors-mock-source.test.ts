import { beforeEach, describe, expect, it } from "vitest";

import { CollectorsMockSource } from "@/features/collectors/data/collectors-mock-source";
import {
  createCollectorsRepository,
  type CollectorsRepository,
} from "@/features/collectors/data/collectors-repository";
import { newCollectorInputSchema } from "@/features/collectors/data/models";
import { resetMockWorld, type MockWorld } from "@/mock/mock-world";

const now = new Date("2026-11-07T09:00:00Z"); // a Saturday
let world: MockWorld;
let repo: CollectorsRepository;

beforeEach(() => {
  world = resetMockWorld(now);
  repo = createCollectorsRepository(new CollectorsMockSource(world, () => now));
});

describe("collectors mock source", () => {
  it("lists online collectors first and filters by search", async () => {
    const all = await repo.list({});
    expect(all.ok && all.data.items[0]?.online).toBe(true);

    const ruwan = await repo.list({ q: "abc-1234" });
    expect(ruwan.ok && ruwan.data.items.map((c) => c.code)).toEqual([
      "COL-0457",
    ]);
  });

  it("shows Ruwan's load and today's earnings", async () => {
    const result = await repo.get("col_457");

    expect(result).toMatchObject({
      ok: true,
      data: { loadKg: 20.5, earnings: { todayCents: 82_000 } },
    });
    if (result.ok) {
      expect(result.data.earnings.weekCents).toBeGreaterThanOrEqual(82_000);
      expect(result.data.earnings.monthCents).toBeGreaterThanOrEqual(
        result.data.earnings.weekCents,
      );
    }
  });

  it("creates a collector with the next COL- code, offline", async () => {
    const input = newCollectorInputSchema.parse({
      firstName: "Kasun",
      lastName: "Perera",
      mobile: "077 123 9876",
      area: "Kotte",
      hubId: "hub_plg",
      vehicle: { type: "threeWheeler", plate: "wp abq-7788", capacityKg: 120 },
    });

    const result = await repo.create(input);

    expect(result).toMatchObject({
      ok: true,
      data: {
        code: "COL-0542",
        mobile: "+94771239876",
        online: false,
        vehicle: { plate: "WP ABQ-7788" },
      },
    });
    expect(await repo.create(input)).toMatchObject({
      ok: false,
      error: { code: "MOBILE_IN_USE" },
    });
  });

  it("suspending takes the collector offline and withdraws open offers", async () => {
    world.assignments.push({
      id: "asg_x",
      pickupId: "RT-24841",
      collectorId: "col_515",
      status: "offered",
      note: null,
      offeredAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 45_000).toISOString(),
      respondedAt: null,
      declineReason: null,
      offeredBy: "Kasun Jayawardena",
    });

    const result = await repo.setStatus("col_515", {
      status: "suspended",
      reason: "Vehicle unsafe",
    });

    expect(result).toMatchObject({
      ok: true,
      data: { status: "suspended", online: false },
    });
    expect(world.assignments[0]?.status).toBe("withdrawn");
  });
});

describe("lk mobile numbers", () => {
  it("accepts local and international forms", () => {
    const parse = (mobile: string) =>
      newCollectorInputSchema.shape.mobile.safeParse(mobile);
    expect(parse("0771234567").data).toBe("+94771234567");
    expect(parse("+94 77 123 4567").data).toBe("+94771234567");
    expect(parse("011 750 0500").success).toBe(false);
  });
});
