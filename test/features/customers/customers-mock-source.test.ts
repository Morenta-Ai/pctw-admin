import { beforeEach, describe, expect, it } from "vitest";

import { CustomersMockSource } from "@/features/customers/data/customers-mock-source";
import {
  createCustomersRepository,
  type CustomersRepository,
} from "@/features/customers/data/customers-repository";
import { statusChangeSchema } from "@/features/customers/data/models";
import { resetMockWorld } from "@/mock/mock-world";

let repo: CustomersRepository;

beforeEach(() => {
  repo = createCustomersRepository(
    new CustomersMockSource(resetMockWorld(new Date("2026-11-07T06:00:00Z"))),
  );
});

describe("customers mock source", () => {
  it("searches by name and area and filters suspended accounts", async () => {
    const nadeesha = await repo.list({ q: "nadeesha" });
    expect(nadeesha.ok && nadeesha.data.items.map((c) => c.id)).toEqual([
      "cus_1",
    ]);

    const suspended = await repo.list({ status: "suspended" });
    expect(suspended.ok && suspended.data.items.map((c) => c.id)).toEqual([
      "cus_18",
    ]);
  });

  it("totals weighed pickups and wallet in whole cents", async () => {
    const result = await repo.get("cus_10"); // Wellawatte: RT-24790, 6.2 kg today
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Number.isInteger(result.data.walletBalanceCents)).toBe(true);
      expect(result.data.walletBalanceCents).toBe(result.data.earnedCents);
      expect(result.data.recentPickups.some((p) => p.id === "RT-24790")).toBe(
        true,
      );
    }
  });

  it("suspends with a reason and reactivates", async () => {
    expect(
      await repo.setStatus("cus_2", {
        status: "suspended",
        reason: "Fake bookings",
      }),
    ).toMatchObject({ ok: true, data: { status: "suspended" } });
    expect(await repo.setStatus("cus_2", { status: "active" })).toMatchObject({
      ok: true,
      data: { status: "active" },
    });
  });
});

describe("statusChangeSchema", () => {
  it("needs a reason to suspend but not to reactivate", () => {
    expect(statusChangeSchema.safeParse({ status: "suspended" }).success).toBe(
      false,
    );
    expect(statusChangeSchema.safeParse({ status: "active" }).success).toBe(
      true,
    );
  });
});
