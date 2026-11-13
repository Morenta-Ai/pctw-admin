import "server-only";

import { seedOrders, seedProducts, seedVendors } from "@/mock/seed/marketplace";
import { seedCollectors, seedCustomers } from "@/mock/seed/people";
import { seedPickups } from "@/mock/seed/pickups";
import { seedHubs } from "@/mock/seed/places";
import { seedMultipliers, seedRateSets } from "@/mock/seed/rates";
import { createRandom } from "@/mock/seed/random";
import { staffIdFromMockToken } from "@/mock/mock-tokens";
import { seedStaff, type MockStaffAccount } from "@/mock/seed/staff";
import type {
  MockAssignment,
  MockCollector,
  MockCustomer,
  MockHub,
  MockMultiplier,
  MockOrder,
  MockPickup,
  MockProduct,
  MockRates,
  MockRateSet,
  MockVendor,
} from "@/mock/types";

/**
 * The in-memory stand-in for the .NET API while it doesn't exist.
 *
 * Every `*-mock-source.ts` reads and writes this one object, so a change made
 * on one page (assigning a collector, say) shows up on every other page, the
 * same way the apps' MockWorld works. Seed data comes from the same samples
 * the user and collector apps use, so IDs like `RT-24841` and `COL-0457`
 * line up across all three.
 *
 * State lives for the life of the server process and resets on restart.
 */
export class MockWorld {
  /** When this world was seeded. Mock timestamps are relative to it. */
  readonly seededAt: Date;

  staff: MockStaffAccount[];
  rates: MockRates;
  hubs: MockHub[];
  collectors: MockCollector[];
  customers: MockCustomer[];
  pickups: MockPickup[];
  vendors: MockVendor[];
  products: MockProduct[];
  orders: MockOrder[];
  assignments: MockAssignment[] = [];
  rateSets: MockRateSet[];
  multipliers: MockMultiplier[];
  multipliersUpdated: { at: string; by: string };

  constructor(now: Date = new Date()) {
    this.seededAt = now;
    // Same seed every start, so the data is predictable in dev and tests.
    const random = createRandom(24_841);
    this.staff = seedStaff();
    this.rateSets = seedRateSets();
    this.rates = this.rateSets.at(-1)!;
    this.multipliers = seedMultipliers();
    this.multipliersUpdated = {
      at: "2026-09-24T08:20:00.000Z",
      by: "Nadeesha Perera",
    };
    this.hubs = seedHubs();
    this.collectors = seedCollectors(random, now);
    this.customers = seedCustomers(random, now);
    this.pickups = seedPickups(
      random,
      now,
      this.customers,
      this.collectors,
      this.rates,
    );
    this.vendors = seedVendors();
    this.products = seedProducts(random, now);
    this.orders = seedOrders(
      random,
      now,
      this.customers,
      this.products,
      this.vendors,
      this.rates,
    );
  }

  customer(id: string): MockCustomer | undefined {
    return this.customers.find((customer) => customer.id === id);
  }

  /**
   * Plays the collector's side of open offers up to `now`, so reads see
   * what the collector app would have done by then:
   *
   * - a collector already on a job declines after 6 s ("Already on a job")
   * - COL-0421 never answers, so the offer expires at 45 s
   * - anyone else accepts after 8 s, and the pickup becomes theirs
   */
  settleAssignments(now: Date): void {
    for (const offer of this.assignments) {
      if (offer.status !== "offered") continue;
      const collector = this.collector(offer.collectorId);
      const pickup = this.pickups.find((p) => p.id === offer.pickupId);
      const offeredAt = Date.parse(offer.offeredAt);
      const busy = this.pickups.some(
        (p) =>
          p.collectorId === offer.collectorId &&
          ["assigned", "enRoute", "arrived"].includes(p.status),
      );
      const at = (ms: number) => new Date(offeredAt + ms).toISOString();

      if (!pickup || pickup.status !== "pending") {
        offer.status = "withdrawn";
        offer.respondedAt = now.toISOString();
      } else if (collector?.code !== "COL-0421" && busy) {
        if (now.getTime() >= offeredAt + 6_000) {
          offer.status = "declined";
          offer.declineReason = "Already on a job";
          offer.respondedAt = at(6_000);
        }
      } else if (collector && collector.code !== "COL-0421") {
        if (now.getTime() >= offeredAt + 8_000) {
          offer.status = "accepted";
          offer.respondedAt = at(8_000);
          pickup.status = "assigned";
          pickup.collectorId = collector.id;
          pickup.timeline.push({
            status: "assigned",
            occurredAt: offer.respondedAt,
            actor: `${collector.firstName} ${collector.lastName}`,
          });
        }
      }
      if (
        offer.status === "offered" &&
        now.getTime() >= Date.parse(offer.expiresAt)
      ) {
        offer.status = "expired";
        offer.respondedAt = offer.expiresAt;
      }
    }
  }

  /** The staff member a mock access token belongs to, for timeline actors. */
  staffForToken(token: string | undefined): MockStaffAccount | undefined {
    const id = staffIdFromMockToken(token);
    return this.staff.find((staff) => staff.id === id);
  }

  collector(id: string | null): MockCollector | undefined {
    return id ? this.collectors.find((c) => c.id === id) : undefined;
  }

  private sequence = 0;

  /** A unique opaque id, such as `ord_3`. */
  nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}_${this.sequence}`;
  }
}

// Kept on globalThis so dev-server hot reloads don't wipe the world.
const store = globalThis as typeof globalThis & {
  __rethreadMockWorld?: MockWorld;
};

export function getMockWorld(): MockWorld {
  store.__rethreadMockWorld ??= new MockWorld();
  return store.__rethreadMockWorld;
}

/** Starts again from the seed data. For tests and the dev reset button. */
export function resetMockWorld(now?: Date): MockWorld {
  store.__rethreadMockWorld = new MockWorld(now);
  return store.__rethreadMockWorld;
}

/** A short pause, so loading states show in dev as they would against the API. */
export async function mockLatency(ms = 200): Promise<void> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}
