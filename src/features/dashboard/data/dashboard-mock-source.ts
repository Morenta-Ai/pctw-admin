import "server-only";

import { addDays, colomboDateKey } from "@/core/time";
import type { DashboardSource } from "@/features/dashboard/data/dashboard-source";
import type {
  Activity,
  Dashboard,
  DailyCollection,
} from "@/features/dashboard/data/models";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import type { MockPickup, PickupStatus } from "@/mock/types";

const OVERDUE_MS = 30 * 60_000;
const round2 = (kg: number) => Math.round(kg * 100) / 100;

/** When a pickup reached a status, if it has. */
const reachedAt = (pickup: MockPickup, status: PickupStatus) =>
  pickup.timeline.find((event) => event.status === status)?.occurredAt;

/** Computes the dashboard from the MockWorld the way the API would from the database. */
export class DashboardMockSource implements DashboardSource {
  constructor(
    private readonly world: MockWorld,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getDashboard(): Promise<Dashboard> {
    await mockLatency(300);
    const now = this.now();
    const today = colomboDateKey(now);
    this.world.settleAssignments(now);
    const { pickups, collectors, orders } = this.world;

    const scheduledToday = pickups.filter((p) => p.scheduledDate === today);
    const countOf = (status: PickupStatus) =>
      scheduledToday.filter((p) => p.status === status).length;

    const weighedOn = (date: string) =>
      pickups.filter((p) => {
        const at = reachedAt(p, "collected");
        return at !== undefined && colomboDateKey(at) === date;
      });
    const weighedToday = weighedOn(today);

    const daily: DailyCollection[] = Array.from({ length: 14 }, (_, i) => {
      const date = addDays(today, i - 13);
      return {
        date,
        pickups: pickups.filter((p) => p.scheduledDate === date).length,
        collectedKg: round2(
          weighedOn(date).reduce((sum, p) => sum + (p.actualWeightKg ?? 0), 0),
        ),
      };
    });

    return {
      date: today,
      pickupsToday: {
        total: scheduledToday.length,
        pending: countOf("pending"),
        assigned: countOf("assigned"),
        enRoute: countOf("enRoute"),
        arrived: countOf("arrived"),
        collected: countOf("collected"),
        deliveredToHub: countOf("deliveredToHub"),
        cancelled: countOf("cancelled"),
      },
      unassignedOverdue: pickups.filter(
        (p) =>
          p.status === "pending" &&
          now.getTime() - new Date(p.createdAt).getTime() > OVERDUE_MS,
      ).length,
      collectedTodayKg: round2(
        weighedToday.reduce((sum, p) => sum + (p.actualWeightKg ?? 0), 0),
      ),
      customerPayoutsTodayCents: weighedToday.reduce(
        (sum, p) => sum + (p.customerPayoutCents ?? 0),
        0,
      ),
      collectorPayoutsTodayCents: weighedToday.reduce(
        (sum, p) => sum + (p.collectorPayoutCents ?? 0),
        0,
      ),
      collectors: {
        online: collectors.filter((c) => c.status === "active" && c.online)
          .length,
        active: collectors.filter((c) => c.status === "active").length,
      },
      orders: {
        open: orders.filter(
          (o) => o.status !== "completed" && o.status !== "cancelled",
        ).length,
        placedToday: orders.filter((o) => colomboDateKey(o.createdAt) === today)
          .length,
      },
      daily,
      recentActivity: this.recentActivity(now),
    };
  }

  private recentActivity(now: Date): Activity[] {
    const events: Activity[] = [];
    const typeFor: Partial<Record<PickupStatus, Activity["type"]>> = {
      pending: "pickupRequested",
      assigned: "pickupAssigned",
      collected: "pickupCollected",
      deliveredToHub: "pickupDelivered",
      cancelled: "pickupCancelled",
    };

    for (const pickup of this.world.pickups) {
      const collector = this.world.collector(pickup.collectorId);
      for (const event of pickup.timeline) {
        const type = typeFor[event.status];
        if (!type) continue;
        events.push({
          id: `act_${pickup.id}_${event.status}`,
          type,
          subjectId: pickup.id,
          summary: summarise(pickup, event.status, collector?.firstName),
          occurredAt: event.occurredAt,
        });
      }
    }
    for (const order of this.world.orders) {
      const customer = this.world.customer(order.customerId);
      events.push({
        id: `act_${order.id}_placed`,
        type: "orderPlaced",
        subjectId: order.id,
        summary: `${customer?.firstName ?? "Customer"} · ${order.items.length} item${order.items.length === 1 ? "" : "s"} · ${order.fulfilmentType === "homeDelivery" ? "home delivery" : "click & collect"}`,
        occurredAt: order.createdAt,
      });
    }

    return events
      .filter((event) => new Date(event.occurredAt) <= now)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, 10);
  }
}

function summarise(
  pickup: MockPickup,
  status: PickupStatus,
  collectorName: string | undefined,
): string {
  switch (status) {
    case "pending":
      return `${pickup.area} · about ${pickup.estimatedKg} kg · ${pickup.source === "app" ? "booked in the app" : "booked by the call centre"}`;
    case "assigned":
      return `${pickup.area} · ${collectorName ?? "a collector"} accepted`;
    case "collected":
      return `${pickup.area} · ${pickup.actualWeightKg?.toFixed(2)} kg weighed by ${collectorName ?? "the collector"}`;
    case "deliveredToHub":
      return `${pickup.area} · ${pickup.actualWeightKg?.toFixed(2)} kg at the hub`;
    case "cancelled":
      return `${pickup.area} · ${pickup.cancelReason ?? "cancelled"}`;
    default:
      return pickup.area;
  }
}
