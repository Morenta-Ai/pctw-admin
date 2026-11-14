import "server-only";

import { ApiError } from "@/core/api/api-error";
import { paginate } from "@/core/paged";
import type { CustomersSource } from "@/features/customers/data/customers-source";
import type {
  CustomerDetail,
  CustomerQuery,
  CustomerSummary,
  StatusChange,
} from "@/features/customers/data/models";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import type { MockCustomer } from "@/mock/types";

export class CustomersMockSource implements CustomersSource {
  constructor(private readonly world: MockWorld) {}

  async list(query: CustomerQuery) {
    await mockLatency();
    const q = query.q?.toLowerCase();
    const rows = this.world.customers
      .filter((c) => !query.status || c.status === query.status)
      .filter(
        (c) =>
          !q ||
          `${c.firstName} ${c.lastName} ${c.mobile} ${c.email ?? ""} ${c.area}`
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
    const page = paginate(rows, query.page);
    return { ...page, items: page.items.map((c) => this.toSummary(c)) };
  }

  async get(id: string) {
    await mockLatency();
    return this.toDetail(this.find(id));
  }

  async setStatus(id: string, change: StatusChange) {
    await mockLatency(300);
    const customer = this.find(id);
    customer.status = change.status;
    customer.statusReason =
      change.status === "suspended" ? change.reason : undefined;
    return this.toDetail(customer);
  }

  private find(id: string): MockCustomer {
    const customer = this.world.customers.find((c) => c.id === id);
    if (!customer) {
      throw new ApiError({
        code: "CUSTOMER_NOT_FOUND",
        message: `No customer ${id}.`,
        status: 404,
      });
    }
    return customer;
  }

  private weighed(customer: MockCustomer) {
    return this.world.pickups.filter(
      (p) => p.customerId === customer.id && p.actualWeightKg !== null,
    );
  }

  private toSummary(customer: MockCustomer): CustomerSummary {
    const weighed = this.weighed(customer);
    return {
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`,
      mobile: customer.mobile,
      email: customer.email,
      area: customer.area,
      status: customer.status,
      joinedAt: customer.joinedAt,
      pickupCount: weighed.length,
      collectedKg:
        Math.round(
          weighed.reduce((sum, p) => sum + (p.actualWeightKg ?? 0), 0) * 100,
        ) / 100,
      walletBalanceCents: this.world.walletBalanceCents(customer.id),
    };
  }

  private toDetail(customer: MockCustomer): CustomerDetail {
    return {
      ...this.toSummary(customer),
      address: customer.address,
      familyMemberCount: customer.familyMemberCount,
      earnedCents: this.world.earnedCents(customer.id),
      recentPickups: this.world.pickups
        .filter((p) => p.customerId === customer.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10)
        .map((p) => ({
          id: p.id,
          status: p.status,
          scheduledDate: p.scheduledDate,
          estimatedKg: p.estimatedKg,
          actualWeightKg: p.actualWeightKg,
          customerPayoutCents: p.customerPayoutCents,
        })),
    };
  }
}
