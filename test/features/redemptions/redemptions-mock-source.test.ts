import { beforeEach, describe, expect, it } from "vitest";

import { RedemptionsMockSource } from "@/features/redemptions/data/redemptions-mock-source";
import {
  createRedemptionsRepository,
  type RedemptionsRepository,
} from "@/features/redemptions/data/redemptions-repository";
import { resetMockWorld, type MockWorld } from "@/mock/mock-world";

const now = new Date("2026-11-07T06:00:00Z");
let world: MockWorld;
let repo: RedemptionsRepository;

beforeEach(() => {
  world = resetMockWorld(now);
  repo = createRedemptionsRepository(
    new RedemptionsMockSource(
      world,
      async () => "mock.stf_2.access.1",
      () => now,
    ),
  );
});

describe("seeded wallets", () => {
  it("never leave a customer with a negative balance", () => {
    for (const customer of world.customers) {
      expect(world.walletBalanceCents(customer.id)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("redemptions mock source", () => {
  it("lists the pending cash queue oldest first", async () => {
    const result = await repo.list({ type: "cash", status: "pending" });

    expect(result.ok && result.data.items.map((r) => r.id)).toEqual([
      "red_1",
      "red_2",
      "red_3",
    ]);
    expect(result.ok && result.data.items[0]?.bank?.accountNumber).toMatch(
      /^\d{10}$/,
    );
  });

  it("marks a transfer paid with the reference and who did it", async () => {
    expect(await repo.pay("red_1", "CEFT 1107-88213")).toMatchObject({
      ok: true,
      data: {
        status: "paid",
        reference: "CEFT 1107-88213",
        processedBy: "Kasun Jayawardena",
        processedAt: now.toISOString(),
      },
    });
    expect(await repo.pay("red_1", "again")).toMatchObject({
      ok: false,
      error: { code: "REDEMPTION_CLOSED" },
    });
  });

  it("returns a rejected transfer to the customer's wallet", async () => {
    const customerId = world.redemptions.find(
      (r) => r.id === "red_2",
    )!.customerId;
    const before = world.walletBalanceCents(customerId);

    await repo.reject("red_2", "Account name doesn't match.");

    expect(world.walletBalanceCents(customerId)).toBe(before + 75_000);
  });

  it("shows the project for donations and the code for vouchers", async () => {
    const donations = await repo.list({ type: "donation" });
    const vouchers = await repo.list({ type: "voucher" });

    expect(
      donations.ok && donations.data.items[0]?.donation?.projectName,
    ).toMatch(/Monaragala/);
    expect(
      vouchers.ok && vouchers.data.items.every((r) => r.voucher?.code),
    ).toBe(true);
  });
});
