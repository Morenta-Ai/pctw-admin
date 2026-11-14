import "server-only";

import { ApiError } from "@/core/api/api-error";
import { paginate } from "@/core/paged";
import { addDays, colomboDateKey } from "@/core/time";
import type { CollectorsSource } from "@/features/collectors/data/collectors-source";
import type {
  CollectorDetail,
  CollectorQuery,
  CollectorSummary,
  NewCollectorInput,
} from "@/features/collectors/data/models";
import type { StatusChange } from "@/features/customers/data/models";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import { areas } from "@/mock/seed/places";
import type { MockCollector, MockPickup } from "@/mock/types";

const round2 = (kg: number) => Math.round(kg * 100) / 100;

export class CollectorsMockSource implements CollectorsSource {
  constructor(
    private readonly world: MockWorld,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(query: CollectorQuery) {
    await mockLatency();
    const q = query.q?.toLowerCase();
    const rows = this.world.collectors
      .filter((c) => !query.status || c.status === query.status)
      .filter((c) => !query.online || String(c.online) === query.online)
      .filter(
        (c) =>
          !q ||
          `${c.code} ${c.firstName} ${c.lastName} ${c.mobile} ${c.area} ${c.vehicle.plate}`
            .toLowerCase()
            .includes(q),
      )
      .sort(
        (a, b) =>
          Number(b.online) - Number(a.online) || a.code.localeCompare(b.code),
      );
    const page = paginate(rows, query.page);
    return { ...page, items: page.items.map((c) => this.toSummary(c)) };
  }

  async get(id: string) {
    await mockLatency();
    return this.toDetail(this.find(id));
  }

  async create(input: NewCollectorInput) {
    await mockLatency(300);
    if (this.world.collectors.some((c) => c.mobile === input.mobile)) {
      throw new ApiError({
        code: "MOBILE_IN_USE",
        message: "Another collector has this mobile number.",
        status: 409,
        details: { mobile: "Another collector has this mobile number." },
      });
    }
    const next =
      Math.max(...this.world.collectors.map((c) => Number(c.code.slice(4)))) +
      1;
    const area =
      areas.find((a) => a.name.toLowerCase() === input.area.toLowerCase()) ??
      areas[0]!;
    const collector: MockCollector = {
      id: `col_${next}`,
      code: `COL-${String(next).padStart(4, "0")}`,
      firstName: input.firstName,
      lastName: input.lastName,
      mobile: input.mobile,
      status: "active",
      online: false,
      latitude: area.latitude,
      longitude: area.longitude,
      lastSeenAt: this.now().toISOString(),
      area: input.area,
      hubId: input.hubId,
      vehicle: input.vehicle,
      rating: 5,
      memberSince: colomboDateKey(this.now()),
    };
    this.world.collectors.push(collector);
    return this.toDetail(collector);
  }

  async setStatus(id: string, change: StatusChange) {
    await mockLatency(300);
    const collector = this.find(id);
    collector.status = change.status;
    collector.statusReason =
      change.status === "suspended" ? change.reason : undefined;
    if (change.status === "suspended") {
      collector.online = false;
      for (const offer of this.world.assignments) {
        if (offer.collectorId === id && offer.status === "offered") {
          offer.status = "withdrawn";
          offer.respondedAt = this.now().toISOString();
        }
      }
    }
    return this.toDetail(collector);
  }

  async listHubs() {
    await mockLatency(80);
    return this.world.hubs.map(({ id, code, name, closesAt }) => ({
      id,
      code,
      name,
      closesAt,
    }));
  }

  private find(id: string): MockCollector {
    const collector = this.world.collectors.find((c) => c.id === id);
    if (!collector) {
      throw new ApiError({
        code: "COLLECTOR_NOT_FOUND",
        message: `No collector ${id}.`,
        status: 404,
      });
    }
    return collector;
  }

  /** The collector's weighed pickups with the Colombo day they were weighed. */
  private weighed(
    collector: MockCollector,
  ): { pickup: MockPickup; day: string }[] {
    return this.world.pickups.flatMap((pickup) => {
      if (pickup.collectorId !== collector.id) return [];
      const at = pickup.timeline.find(
        (e) => e.status === "collected",
      )?.occurredAt;
      return at ? [{ pickup, day: colomboDateKey(at) }] : [];
    });
  }

  private weekStart(today: string): string {
    // getUTCDay of noon on the Colombo date; Monday starts the week.
    const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
    return addDays(today, -((weekday + 6) % 7));
  }

  private toSummary(collector: MockCollector): CollectorSummary {
    const today = colomboDateKey(this.now());
    const week = this.weekStart(today);
    const hub = this.world.hubs.find((h) => h.id === collector.hubId);
    return {
      id: collector.id,
      code: collector.code,
      name: `${collector.firstName} ${collector.lastName}`,
      mobile: collector.mobile,
      status: collector.status,
      online: collector.online,
      area: collector.area,
      hub: { id: collector.hubId, name: hub?.name ?? collector.hubId },
      vehicle: collector.vehicle,
      rating: collector.rating,
      memberSince: collector.memberSince,
      collectedKgThisWeek: round2(
        this.weighed(collector)
          .filter(({ day }) => day >= week)
          .reduce((sum, { pickup }) => sum + (pickup.actualWeightKg ?? 0), 0),
      ),
    };
  }

  private toDetail(collector: MockCollector): CollectorDetail {
    const today = colomboDateKey(this.now());
    const week = this.weekStart(today);
    const month = today.slice(0, 8);
    const weighed = this.weighed(collector);
    const payout = (from: (day: string) => boolean) =>
      weighed
        .filter(({ day }) => from(day))
        .reduce(
          (sum, { pickup }) => sum + (pickup.collectorPayoutCents ?? 0),
          0,
        );

    return {
      ...this.toSummary(collector),
      loadKg: round2(
        this.world.pickups
          .filter(
            (p) => p.collectorId === collector.id && p.status === "collected",
          )
          .reduce((sum, p) => sum + (p.actualWeightKg ?? 0), 0),
      ),
      earnings: {
        todayCents: payout((day) => day === today),
        weekCents: payout((day) => day >= week),
        monthCents: payout((day) => day.startsWith(month)),
      },
      recentJobs: this.world.pickups
        .filter((p) => p.collectorId === collector.id)
        .sort((a, b) => b.windowStart.localeCompare(a.windowStart))
        .slice(0, 10)
        .map((p) => ({
          id: p.id,
          status: p.status,
          scheduledDate: p.scheduledDate,
          area: p.area,
          actualWeightKg: p.actualWeightKg,
          collectorPayoutCents: p.collectorPayoutCents,
        })),
    };
  }
}
