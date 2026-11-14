import { beforeEach, describe, expect, it } from "vitest";

import { DonationsMockSource } from "@/features/donations/data/donations-mock-source";
import {
  createDonationsRepository,
  type DonationsRepository,
} from "@/features/donations/data/donations-repository";
import { resetMockWorld } from "@/mock/mock-world";

const now = new Date("2026-11-07T06:00:00Z");
let repo: DonationsRepository;

beforeEach(() => {
  repo = createDonationsRepository(
    new DonationsMockSource(resetMockWorld(now), () => now),
  );
});

describe("donations mock source", () => {
  it("adds customers' donations to what each project has raised", async () => {
    const result = await repo.list();
    const monaragala = result.ok
      ? result.data.find((p) => p.id === "dp_monaragala")
      : undefined;

    // 339,500.00 raised before, plus a Rs. 500 donation in the wallet seed.
    expect(monaragala).toMatchObject({
      raisedCents: 34_000_000,
      donorCount: 812,
    });
    expect(result.ok && result.data.at(-1)?.active).toBe(false);
  });

  it("creates and closes a project", async () => {
    const created = await repo.create({
      name: "Sewing machines for Batticaloa women's co-op",
      summary: "Livelihoods · 30 tailors",
      goalCents: 150_000_000,
      active: true,
      endsOn: null,
    });
    expect(created).toMatchObject({
      ok: true,
      data: { raisedCents: 0, donorCount: 0 },
    });

    const id = created.ok ? created.data.id : "";
    expect(await repo.update(id, { active: false })).toMatchObject({
      data: { active: false },
    });
  });

  it("refuses an end date in the past", async () => {
    expect(
      await repo.update("dp_jaffna_library", { endsOn: "2026-11-01" }),
    ).toMatchObject({
      ok: false,
      error: { status: 422 },
    });
  });
});
