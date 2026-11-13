import { beforeEach, describe, expect, it } from "vitest";

import { PickupsMockSource } from "@/features/pickups/data/pickups-mock-source";
import {
  createPickupsRepository,
  type PickupsRepository,
} from "@/features/pickups/data/pickups-repository";
import { resetMockWorld } from "@/mock/mock-world";

const now = new Date("2026-11-07T09:00:00Z");
let repo: PickupsRepository;

beforeEach(() => {
  repo = createPickupsRepository(
    new PickupsMockSource(
      resetMockWorld(now),
      async () => "mock.stf_2.access.tok_1",
      () => now,
    ),
  );
});

async function list(query: Parameters<PickupsRepository["list"]>[0]) {
  const result = await repo.list(query);
  if (!result.ok) throw result.error;
  return result.data;
}

describe("pickups mock source", () => {
  it("filters by status and date, newest first", async () => {
    const page = await list({ status: "pending", date: "2026-11-07" });

    expect(page.items.map((p) => p.id)).toEqual([
      "RT-24844",
      "RT-24835",
      "RT-24830",
      "RT-24841",
      "RT-24822",
    ]);
    expect(page.totalCount).toBe(5);
  });

  it("searches by area, customer and collector code", async () => {
    expect((await list({ q: "rajagiriya", date: "2026-11-07" })).items).toEqual(
      [expect.objectContaining({ id: "RT-24841" })],
    );
    expect((await list({ q: "Fathima" })).items[0]?.customerName).toBe(
      "Fathima Rinoza",
    );
    const ruwan = await list({ q: "col-0457", date: "2026-11-07" });
    expect(ruwan.items.every((p) => p.collector?.code === "COL-0457")).toBe(
      true,
    );
    expect(ruwan.totalCount).toBe(4);
  });

  it("pages 25 at a time and sorts by weight", async () => {
    const all = await list({});
    expect(all.items).toHaveLength(25);
    expect(all.totalCount).toBeGreaterThan(100);

    const heaviest = await list({ sort: "-estimatedKg" });
    const weights = heaviest.items.map((p) => p.estimatedKg);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
  });

  it("returns the detail with the collector and the timeline", async () => {
    const result = await repo.get("RT-24817");

    expect(result).toMatchObject({
      ok: true,
      data: {
        status: "enRoute",
        collector: { code: "COL-0457", vehiclePlate: "WP ABC-1234" },
        customer: { name: "Nadeesha Perera" },
      },
    });
    if (result.ok) {
      expect(result.data.timeline.map((e) => e.status)).toEqual([
        "pending",
        "assigned",
        "enRoute",
      ]);
    }
  });

  it("404s an unknown pickup", async () => {
    expect(await repo.get("RT-1")).toMatchObject({
      ok: false,
      error: { code: "PICKUP_NOT_FOUND", status: 404 },
    });
  });

  it("cancels with the reason and the staff member as actor", async () => {
    const result = await repo.cancel("RT-24841", "Customer is travelling.");

    expect(result).toMatchObject({
      ok: true,
      data: { status: "cancelled", cancelReason: "Customer is travelling." },
    });
    if (result.ok) {
      expect(result.data.timeline.at(-1)).toEqual({
        status: "cancelled",
        occurredAt: now.toISOString(),
        actor: "Kasun Jayawardena",
      });
    }
  });

  it("won't cancel a pickup that has been weighed", async () => {
    expect(await repo.cancel("RT-24790", "Too late")).toMatchObject({
      ok: false,
      error: { code: "PICKUP_NOT_CANCELLABLE", status: 409 },
    });
  });
});
