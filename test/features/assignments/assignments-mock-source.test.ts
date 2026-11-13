import { beforeEach, describe, expect, it } from "vitest";

import { AssignmentsMockSource } from "@/features/assignments/data/assignments-mock-source";
import {
  createAssignmentsRepository,
  type AssignmentsRepository,
} from "@/features/assignments/data/assignments-repository";
import { resetMockWorld, type MockWorld } from "@/mock/mock-world";

const start = new Date("2026-11-07T06:00:00Z");
let clock: Date;
let world: MockWorld;
let repo: AssignmentsRepository;

const later = (seconds: number) => {
  clock = new Date(start.getTime() + seconds * 1000);
};

beforeEach(() => {
  clock = start;
  world = resetMockWorld(start);
  repo = createAssignmentsRepository(
    new AssignmentsMockSource(
      world,
      async () => "mock.stf_2.access.1",
      () => clock,
    ),
  );
});

async function offer(pickupId: string, collectorId: string) {
  const result = await repo.offer(pickupId, { collectorId });
  if (!result.ok) throw result.error;
  return result.data;
}

describe("assignments mock source", () => {
  it("offers with a 45-second window, made by the signed-in staff member", async () => {
    const assignment = await offer("RT-24841", "col_515");

    expect(assignment).toMatchObject({
      status: "offered",
      collector: { code: "COL-0515" },
      offeredBy: "Kasun Jayawardena",
      expiresAt: "2026-11-07T06:00:45.000Z",
    });
  });

  it("a free collector accepts after 8 s and the pickup becomes theirs", async () => {
    const { id } = await offer("RT-24841", "col_515");

    later(5);
    expect(await repo.get(id)).toMatchObject({ data: { status: "offered" } });

    later(9);
    expect(await repo.get(id)).toMatchObject({ data: { status: "accepted" } });
    const pickup = world.pickups.find((p) => p.id === "RT-24841")!;
    expect(pickup).toMatchObject({
      status: "assigned",
      collectorId: "col_515",
    });
    expect(pickup.timeline.at(-1)).toMatchObject({
      status: "assigned",
      actor: "Lahiru Gunasekara",
    });
  });

  it("a collector on a job declines with a reason", async () => {
    const { id } = await offer("RT-24841", "col_457"); // Ruwan, on RT-24817

    later(7);

    expect(await repo.get(id)).toMatchObject({
      data: { status: "declined", declineReason: "Already on a job" },
    });
    expect(world.pickups.find((p) => p.id === "RT-24841")?.status).toBe(
      "pending",
    );
  });

  it("an unanswered offer expires at 45 s", async () => {
    const { id } = await offer("RT-24841", "col_421");

    later(30);
    expect(await repo.get(id)).toMatchObject({ data: { status: "offered" } });
    later(46);
    expect(await repo.get(id)).toMatchObject({ data: { status: "expired" } });
  });

  it("allows one open offer per pickup, and it can be withdrawn", async () => {
    const { id } = await offer("RT-24841", "col_421");

    expect(
      await repo.offer("RT-24841", { collectorId: "col_515" }),
    ).toMatchObject({
      ok: false,
      error: { code: "ASSIGNMENT_PENDING" },
    });

    expect(await repo.withdraw(id)).toMatchObject({
      data: { status: "withdrawn" },
    });
    expect((await repo.offer("RT-24841", { collectorId: "col_515" })).ok).toBe(
      true,
    );
  });

  it("refuses offline collectors, full vehicles and taken pickups", async () => {
    expect(
      await repo.offer("RT-24841", { collectorId: "col_473" }),
    ).toMatchObject({
      error: { code: "COLLECTOR_OFFLINE" },
    });
    // Lahiru's 40 kg motorbike already carries 3.4 kg.
    world.pickups.find((p) => p.id === "RT-24830")!.estimatedKg = 39;
    expect(
      await repo.offer("RT-24830", { collectorId: "col_515" }),
    ).toMatchObject({
      error: { code: "LOAD_FULL" },
    });
    expect(
      await repo.offer("RT-24817", { collectorId: "col_515" }),
    ).toMatchObject({
      error: { code: "PICKUP_ALREADY_ASSIGNED" },
    });
  });

  it("lists a pickup's offers newest first", async () => {
    const first = await offer("RT-24841", "col_457");
    later(10);
    await repo.get(first.id); // declined by now
    const second = await offer("RT-24841", "col_515");

    const result = await repo.listForPickup("RT-24841");

    expect(result.ok && result.data.map((a) => a.id)).toEqual([
      second.id,
      first.id,
    ]);
  });
});
