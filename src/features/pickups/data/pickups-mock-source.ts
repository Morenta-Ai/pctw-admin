import "server-only";

import { ApiError } from "@/core/api/api-error";
import { paginate } from "@/core/paged";
import type {
  PickupDetail,
  PickupQuery,
  PickupSummary,
} from "@/features/pickups/data/models";
import { cancellableStatuses } from "@/features/pickups/data/pickup-status";
import type { PickupsSource } from "@/features/pickups/data/pickups-source";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import type { MockPickup } from "@/mock/types";

export class PickupsMockSource implements PickupsSource {
  constructor(
    private readonly world: MockWorld,
    private readonly getAccessToken: () => Promise<string | undefined>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(query: PickupQuery) {
    await mockLatency();
    const q = query.q?.toLowerCase();
    const rows = this.world.pickups
      .filter((p) => !query.status || p.status === query.status)
      .filter((p) => !query.source || p.source === query.source)
      .filter((p) => !query.date || p.scheduledDate === query.date)
      .filter((p) => !q || this.searchText(p).includes(q));

    const sort = query.sort ?? "-createdAt";
    const field = sort.replace(/^-/, "") as
      "createdAt" | "scheduledDate" | "estimatedKg";
    const direction = sort.startsWith("-") ? -1 : 1;
    rows.sort((a, b) => {
      const order =
        field === "estimatedKg"
          ? a.estimatedKg - b.estimatedKg
          : field === "scheduledDate"
            ? a.windowStart.localeCompare(b.windowStart)
            : a.createdAt.localeCompare(b.createdAt);
      return order * direction || b.id.localeCompare(a.id);
    });

    const page = paginate(rows, query.page);
    return { ...page, items: page.items.map((p) => this.toSummary(p)) };
  }

  async get(id: string) {
    await mockLatency();
    return this.toDetail(this.find(id));
  }

  async cancel(id: string, reason: string) {
    await mockLatency(300);
    const pickup = this.find(id);
    if (!cancellableStatuses.includes(pickup.status)) {
      throw new ApiError({
        code: "PICKUP_NOT_CANCELLABLE",
        message: `${id} is ${pickup.status} and can't be cancelled.`,
        status: 409,
      });
    }
    const staff = this.world.staffForToken(await this.getAccessToken());
    pickup.status = "cancelled";
    pickup.cancelReason = reason;
    pickup.timeline.push({
      status: "cancelled",
      occurredAt: this.now().toISOString(),
      actor: staff?.name ?? "Call centre",
    });
    return this.toDetail(pickup);
  }

  private find(id: string): MockPickup {
    const pickup = this.world.pickups.find((p) => p.id === id);
    if (!pickup) {
      throw new ApiError({
        code: "PICKUP_NOT_FOUND",
        message: `No pickup ${id}.`,
        status: 404,
      });
    }
    return pickup;
  }

  private searchText(pickup: MockPickup): string {
    const customer = this.world.customer(pickup.customerId);
    const collector = this.world.collector(pickup.collectorId);
    return [
      pickup.id,
      pickup.area,
      customer?.firstName,
      customer?.lastName,
      customer?.mobile,
      collector?.code,
    ]
      .join(" ")
      .toLowerCase();
  }

  private toSummary(pickup: MockPickup): PickupSummary {
    const customer = this.world.customer(pickup.customerId);
    const collector = this.world.collector(pickup.collectorId);
    return {
      id: pickup.id,
      status: pickup.status,
      source: pickup.source,
      method: pickup.method,
      customerName: customer
        ? `${customer.firstName} ${customer.lastName}`
        : "Unknown customer",
      area: pickup.area,
      scheduledDate: pickup.scheduledDate,
      slot: pickup.slot,
      windowStart: pickup.windowStart,
      windowEnd: pickup.windowEnd,
      estimatedKg: pickup.estimatedKg,
      actualWeightKg: pickup.actualWeightKg,
      collector: collector
        ? {
            id: collector.id,
            code: collector.code,
            name: `${collector.firstName} ${collector.lastName}`,
          }
        : null,
      createdAt: pickup.createdAt,
    };
  }

  private toDetail(pickup: MockPickup): PickupDetail {
    const customer = this.world.customer(pickup.customerId);
    const collector = this.world.collector(pickup.collectorId);
    const hub = this.world.hubs.find((h) => h.id === pickup.hubId);
    return {
      id: pickup.id,
      status: pickup.status,
      source: pickup.source,
      method: pickup.method,
      customer: {
        id: pickup.customerId,
        name: customer
          ? `${customer.firstName} ${customer.lastName}`
          : "Unknown customer",
        mobile: customer?.mobile ?? "",
      },
      area: pickup.area,
      address: pickup.address,
      latitude: pickup.latitude,
      longitude: pickup.longitude,
      scheduledDate: pickup.scheduledDate,
      slot: pickup.slot,
      windowStart: pickup.windowStart,
      windowEnd: pickup.windowEnd,
      estimatedKg: pickup.estimatedKg,
      itemCount: pickup.itemCount,
      bagCount: pickup.bagCount,
      actualWeightKg: pickup.actualWeightKg,
      note: pickup.note,
      items: pickup.items,
      collector: collector
        ? {
            id: collector.id,
            code: collector.code,
            name: `${collector.firstName} ${collector.lastName}`,
            mobile: collector.mobile,
            vehiclePlate: collector.vehicle.plate,
          }
        : null,
      customerRatePerKgCents: pickup.customerRatePerKgCents,
      collectorRatePerKgCents: pickup.collectorRatePerKgCents,
      customerPayoutCents: pickup.customerPayoutCents,
      collectorPayoutCents: pickup.collectorPayoutCents,
      hub: hub ? { id: hub.id, name: hub.name } : null,
      cancelReason: pickup.cancelReason,
      createdAt: pickup.createdAt,
      timeline: pickup.timeline,
    };
  }
}
