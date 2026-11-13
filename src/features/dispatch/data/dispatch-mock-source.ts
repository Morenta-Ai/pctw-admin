import "server-only";

import { colomboDateKey } from "@/core/time";
import type { DispatchSource } from "@/features/dispatch/data/dispatch-source";
import type {
  Dispatch,
  DispatchCollector,
} from "@/features/dispatch/data/models";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import type { MockCollector, MockPickup, PickupStatus } from "@/mock/types";

const openStatuses: PickupStatus[] = [
  "pending",
  "assigned",
  "enRoute",
  "arrived",
];
const TRIP_MS = 25 * 60_000;

/**
 * Builds the live map from the MockWorld. Online collectors drift a little
 * with time, and one on the way moves toward their pickup, so polling shows
 * movement the way real location updates would.
 */
export class DispatchMockSource implements DispatchSource {
  constructor(
    private readonly world: MockWorld,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getDispatch(): Promise<Dispatch> {
    await mockLatency(150);
    const now = this.now();
    const today = colomboDateKey(now);
    this.world.settleAssignments(now);
    const { pickups } = this.world;

    const open = pickups.filter(
      (p) => openStatuses.includes(p.status) && p.scheduledDate >= today,
    );

    return {
      generatedAt: now.toISOString(),
      collectors: this.world.collectors
        .filter((c) => c.status === "active")
        .map((c, i) => this.toCollector(c, i, now)),
      pickups: open.map((p) => {
        const customer = this.world.customer(p.customerId);
        return {
          id: p.id,
          status: p.status,
          source: p.source,
          customerName: customer
            ? `${customer.firstName} ${customer.lastName}`
            : "Unknown customer",
          area: p.area,
          latitude: p.latitude,
          longitude: p.longitude,
          estimatedKg: p.estimatedKg,
          windowStart: p.windowStart,
          windowEnd: p.windowEnd,
          createdAt: p.createdAt,
          collectorId: p.collectorId,
          offer: this.openOffer(p.id),
        };
      }),
      hubs: this.world.hubs.map(({ id, code, name, latitude, longitude }) => ({
        id,
        code,
        name,
        latitude,
        longitude,
      })),
    };
  }

  private openOffer(pickupId: string) {
    const offer = this.world.assignments.find(
      (a) => a.pickupId === pickupId && a.status === "offered",
    );
    const collector = this.world.collector(offer?.collectorId ?? null);
    if (!offer || !collector) return null;
    return {
      assignmentId: offer.id,
      collectorId: collector.id,
      collectorName: `${collector.firstName} ${collector.lastName}`,
      expiresAt: offer.expiresAt,
    };
  }

  private toCollector(
    collector: MockCollector,
    index: number,
    now: Date,
  ): DispatchCollector {
    const mine = this.world.pickups.filter(
      (p) => p.collectorId === collector.id,
    );
    const active = mine.find((p) =>
      ["assigned", "enRoute", "arrived"].includes(p.status),
    );
    const loadKg =
      Math.round(
        mine
          .filter((p) => p.status === "collected")
          .reduce((sum, p) => sum + (p.actualWeightKg ?? 0), 0) * 100,
      ) / 100;

    let { latitude, longitude } = collector;
    if (collector.online) {
      if (active) {
        ({ latitude, longitude } = travel(collector, active, now));
      } else {
        const t = now.getTime() / 90_000 + index;
        latitude += Math.sin(t) * 0.0012;
        longitude += Math.cos(t) * 0.0012;
      }
    }

    return {
      id: collector.id,
      code: collector.code,
      name: `${collector.firstName} ${collector.lastName}`,
      mobile: collector.mobile,
      online: collector.online,
      latitude: round5(latitude),
      longitude: round5(longitude),
      lastSeenAt: collector.online
        ? new Date(now.getTime() - ((index * 7) % 30) * 1000).toISOString()
        : collector.lastSeenAt,
      area: collector.area,
      vehicle: collector.vehicle,
      loadKg,
      activePickupId: active?.id ?? null,
    };
  }
}

/** Where a collector is on the way to a pickup, or at it once arrived. */
function travel(collector: MockCollector, pickup: MockPickup, now: Date) {
  if (pickup.status === "arrived") {
    return { latitude: pickup.latitude, longitude: pickup.longitude };
  }
  if (pickup.status !== "enRoute") return collector;
  const startedAt = pickup.timeline.find(
    (e) => e.status === "enRoute",
  )?.occurredAt;
  const progress = startedAt
    ? Math.min(
        0.9,
        Math.max(0, (now.getTime() - Date.parse(startedAt)) / TRIP_MS),
      )
    : 0;
  return {
    latitude:
      collector.latitude + (pickup.latitude - collector.latitude) * progress,
    longitude:
      collector.longitude + (pickup.longitude - collector.longitude) * progress,
  };
}

const round5 = (value: number) => Math.round(value * 1e5) / 1e5;
