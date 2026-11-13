import "server-only";

import { seedOrders, seedProducts, seedVendors } from "@/mock/seed/marketplace";
import { seedCollectors, seedCustomers } from "@/mock/seed/people";
import { seedPickups } from "@/mock/seed/pickups";
import { seedHubs } from "@/mock/seed/places";
import { createRandom } from "@/mock/seed/random";
import { staffIdFromMockToken } from "@/mock/mock-tokens";
import { seedStaff, type MockStaffAccount } from "@/mock/seed/staff";
import type {
  MockCollector,
  MockCustomer,
  MockHub,
  MockOrder,
  MockPickup,
  MockProduct,
  MockRates,
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

  constructor(now: Date = new Date()) {
    this.seededAt = now;
    // Same seed every start, so the data is predictable in dev and tests.
    const random = createRandom(24_841);
    this.staff = seedStaff();
    this.rates = {
      customerRatePerKgCents: 12_000,
      collectorRatePerKgCents: 4_000,
      homeDeliveryChargeCents: 35_000,
      clickAndCollectChargeCents: 25_000,
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
