import "server-only";

import { ApiError } from "@/core/api/api-error";
import type { AssignmentsSource } from "@/features/assignments/data/assignments-source";
import {
  OFFER_SECONDS,
  type Assignment,
  type OfferInput,
} from "@/features/assignments/data/models";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import type { MockAssignment } from "@/mock/types";

const conflict = (code: string, message: string) =>
  new ApiError({ code, message, status: 409 });

export class AssignmentsMockSource implements AssignmentsSource {
  constructor(
    private readonly world: MockWorld,
    private readonly getAccessToken: () => Promise<string | undefined>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async offer(pickupId: string, input: OfferInput): Promise<Assignment> {
    await mockLatency(300);
    const now = this.now();
    this.world.settleAssignments(now);

    const pickup = this.world.pickups.find((p) => p.id === pickupId);
    if (!pickup) {
      throw new ApiError({
        code: "PICKUP_NOT_FOUND",
        message: `No pickup ${pickupId}.`,
        status: 404,
      });
    }
    if (pickup.status !== "pending") {
      throw conflict(
        "PICKUP_ALREADY_ASSIGNED",
        `${pickupId} already has a collector.`,
      );
    }
    if (
      this.world.assignments.some(
        (a) => a.pickupId === pickupId && a.status === "offered",
      )
    ) {
      throw conflict(
        "ASSIGNMENT_PENDING",
        "An offer for this pickup is still open.",
      );
    }
    const collector = this.world.collector(input.collectorId);
    if (!collector || collector.status !== "active") {
      throw new ApiError({
        code: "COLLECTOR_NOT_FOUND",
        message: "No such collector.",
        status: 404,
      });
    }
    if (!collector.online) {
      throw conflict("COLLECTOR_OFFLINE", `${collector.code} is offline.`);
    }
    const loadKg = this.world.pickups
      .filter((p) => p.collectorId === collector.id && p.status === "collected")
      .reduce((sum, p) => sum + (p.actualWeightKg ?? 0), 0);
    if (collector.vehicle.capacityKg - loadKg < pickup.estimatedKg) {
      throw conflict(
        "LOAD_FULL",
        `${collector.code} has no room for this pickup.`,
      );
    }

    const staff = this.world.staffForToken(await this.getAccessToken());
    const assignment: MockAssignment = {
      id: this.world.nextId("asg"),
      pickupId,
      collectorId: collector.id,
      status: "offered",
      note: input.note ?? null,
      offeredAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + OFFER_SECONDS * 1000).toISOString(),
      respondedAt: null,
      declineReason: null,
      offeredBy: staff?.name ?? "Call centre",
    };
    this.world.assignments.push(assignment);
    return this.toAssignment(assignment);
  }

  async listForPickup(pickupId: string): Promise<Assignment[]> {
    await mockLatency();
    this.world.settleAssignments(this.now());
    return this.world.assignments
      .filter((a) => a.pickupId === pickupId)
      .sort((a, b) => b.offeredAt.localeCompare(a.offeredAt))
      .map((a) => this.toAssignment(a));
  }

  async get(id: string): Promise<Assignment> {
    await mockLatency(80);
    this.world.settleAssignments(this.now());
    return this.toAssignment(this.find(id));
  }

  async withdraw(id: string): Promise<Assignment> {
    await mockLatency();
    const now = this.now();
    this.world.settleAssignments(now);
    const assignment = this.find(id);
    if (assignment.status !== "offered") {
      throw conflict("ASSIGNMENT_CLOSED", "The collector already answered.");
    }
    assignment.status = "withdrawn";
    assignment.respondedAt = now.toISOString();
    return this.toAssignment(assignment);
  }

  private find(id: string): MockAssignment {
    const assignment = this.world.assignments.find((a) => a.id === id);
    if (!assignment) {
      throw new ApiError({
        code: "ASSIGNMENT_NOT_FOUND",
        message: `No assignment ${id}.`,
        status: 404,
      });
    }
    return assignment;
  }

  private toAssignment(assignment: MockAssignment): Assignment {
    const collector = this.world.collector(assignment.collectorId);
    const { collectorId, ...rest } = assignment;
    return {
      ...rest,
      collector: {
        id: collectorId,
        code: collector?.code ?? collectorId,
        name: collector
          ? `${collector.firstName} ${collector.lastName}`
          : "Unknown",
      },
    };
  }
}
