import { beforeEach, describe, expect, it } from "vitest";

import { RatesMockSource } from "@/features/rates/data/rates-mock-source";
import {
  createRatesRepository,
  type RatesRepository,
} from "@/features/rates/data/rates-repository";
import { resetMockWorld, type MockWorld } from "@/mock/mock-world";

const now = new Date("2026-11-07T06:00:00Z");
let clock = now;
let world: MockWorld;
let repo: RatesRepository;

const values = {
  customerRatePerKgCents: 12_500,
  collectorRatePerKgCents: 4_200,
  homeDeliveryChargeCents: 35_000,
  clickAndCollectChargeCents: 25_000,
};

beforeEach(() => {
  clock = now;
  world = resetMockWorld(now);
  repo = createRatesRepository(
    new RatesMockSource(
      world,
      async () => "mock.stf_1.access.1",
      () => clock,
    ),
  );
});

describe("rates mock source", () => {
  it("shows the current rates and earlier ones", async () => {
    const result = await repo.getRates();

    expect(result).toMatchObject({
      ok: true,
      data: {
        current: { id: "rate_3", customerRatePerKgCents: 12_000 },
        scheduled: null,
      },
    });
    expect(result.ok && result.data.history.map((r) => r.id)).toEqual([
      "rate_2",
      "rate_1",
    ]);
  });

  it("applies a change from today at once", async () => {
    const result = await repo.setRates({
      ...values,
      effectiveFrom: "2026-11-07",
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        current: {
          customerRatePerKgCents: 12_500,
          createdBy: "Nadeesha Perera",
        },
      },
    });
    expect(world.rates.customerRatePerKgCents).toBe(12_500);
  });

  it("schedules a later change, replacing an earlier schedule, until its day comes", async () => {
    await repo.setRates({ ...values, effectiveFrom: "2026-12-15" });
    const result = await repo.setRates({
      ...values,
      effectiveFrom: "2026-12-01",
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        current: { id: "rate_3" },
        scheduled: { effectiveFrom: "2026-12-01" },
      },
    });

    clock = new Date("2026-12-01T00:00:00Z"); // 05:30 in Colombo
    expect(await repo.getRates()).toMatchObject({
      data: { current: { effectiveFrom: "2026-12-01" }, scheduled: null },
    });
  });

  it("cancels a scheduled change", async () => {
    await repo.setRates({ ...values, effectiveFrom: "2026-12-01" });

    expect(await repo.cancelScheduled()).toMatchObject({
      data: { scheduled: null },
    });
    expect(await repo.cancelScheduled()).toMatchObject({
      ok: false,
      error: { code: "NO_SCHEDULED_RATES" },
    });
  });

  it("refuses past dates and a collector rate above the customer rate", async () => {
    expect(
      await repo.setRates({ ...values, effectiveFrom: "2026-11-06" }),
    ).toMatchObject({
      error: {
        status: 422,
        fieldErrors: { effectiveFrom: "Choose today or a later date." },
      },
    });
    const tooHigh = await repo.setRates({
      ...values,
      collectorRatePerKgCents: 13_000,
      effectiveFrom: "2026-11-07",
    });
    expect(tooHigh.ok).toBe(false);
  });
});

describe("impact multipliers mock source", () => {
  it("updates some factors and records who did it", async () => {
    const result = await repo.updateMultipliers({
      items: [{ key: "forexSaved", perKg: 50 }],
    });

    expect(
      result.ok && result.data.items.find((m) => m.key === "forexSaved")?.perKg,
    ).toBe(50);
    expect(
      result.ok && result.data.items.find((m) => m.key === "ghgSaved")?.perKg,
    ).toBe(3.5);
    expect(result.ok && result.data.updatedBy).toBe("Nadeesha Perera");
  });

  it("rejects fractional cents for money factors", async () => {
    expect(
      await repo.updateMultipliers({
        items: [{ key: "forexSaved", perKg: 50.5 }],
      }),
    ).toMatchObject({ ok: false, error: { status: 422 } });
  });
});
