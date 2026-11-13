import "server-only";

import { ApiError } from "@/core/api/api-error";
import { paginate } from "@/core/paged";
import { colomboDateKey } from "@/core/time";
import type {
  OrderDetail,
  OrderQuery,
  OrderSummary,
} from "@/features/orders/data/models";
import {
  nextStatuses,
  type OrderStatus,
} from "@/features/orders/data/order-status";
import type { OrdersSource } from "@/features/orders/data/orders-source";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import type { MockOrder } from "@/mock/types";

export class OrdersMockSource implements OrdersSource {
  constructor(
    private readonly world: MockWorld,
    private readonly getAccessToken: () => Promise<string | undefined>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(query: OrderQuery) {
    await mockLatency();
    const q = query.q?.toLowerCase();
    const rows = this.world.orders
      .filter((o) => !query.status || o.status === query.status)
      .filter(
        (o) =>
          !query.fulfilmentType || o.fulfilmentType === query.fulfilmentType,
      )
      .filter((o) => !q || this.searchText(o).includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const page = paginate(rows, query.page);
    return { ...page, items: page.items.map((o) => this.toSummary(o)) };
  }

  async get(id: string) {
    await mockLatency();
    return this.toDetail(this.find(id));
  }

  async setStatus(id: string, status: OrderStatus) {
    await mockLatency(300);
    const order = this.find(id);
    if (!nextStatuses(order.status, order.fulfilmentType).includes(status)) {
      throw new ApiError({
        code: "ORDER_STATUS_CHANGED",
        message: `${id} can't go from ${order.status} to ${status}.`,
        status: 409,
      });
    }
    const now = this.now();
    const staff = this.world.staffForToken(await this.getAccessToken());
    if (status === "confirmed") order.waybillNumber = this.nextWaybill(now);
    order.status = status;
    order.timeline.push({
      status,
      occurredAt: now.toISOString(),
      actor: staff?.name ?? "Call centre",
    });
    return this.toDetail(order);
  }

  /** `WB-261107-0013`: today's date, then the next number in sequence. */
  private nextWaybill(now: Date): string {
    const last = Math.max(
      0,
      ...this.world.orders.map((o) => Number(o.waybillNumber?.slice(-4) ?? 0)),
    );
    const date = colomboDateKey(now).slice(2).replaceAll("-", "");
    return `WB-${date}-${String(last + 1).padStart(4, "0")}`;
  }

  private find(id: string): MockOrder {
    const order = this.world.orders.find((o) => o.id === id);
    if (!order) {
      throw new ApiError({
        code: "ORDER_NOT_FOUND",
        message: `No order ${id}.`,
        status: 404,
      });
    }
    return order;
  }

  private customerName(order: MockOrder): string {
    const customer = this.world.customer(order.customerId);
    return customer
      ? `${customer.firstName} ${customer.lastName}`
      : "Unknown customer";
  }

  private searchText(order: MockOrder): string {
    const customer = this.world.customer(order.customerId);
    return [
      order.id,
      order.waybillNumber,
      this.customerName(order),
      customer?.mobile,
    ]
      .join(" ")
      .toLowerCase();
  }

  private toSummary(order: MockOrder): OrderSummary {
    return {
      id: order.id,
      status: order.status,
      customerName: this.customerName(order),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      totalCents: order.totalCents,
      fulfilmentType: order.fulfilmentType,
      vendorName:
        this.world.vendors.find((v) => v.id === order.vendorId)?.name ?? null,
      waybillNumber: order.waybillNumber,
      createdAt: order.createdAt,
    };
  }

  private toDetail(order: MockOrder): OrderDetail {
    const customer = this.world.customer(order.customerId);
    const vendor = this.world.vendors.find((v) => v.id === order.vendorId);
    return {
      id: order.id,
      status: order.status,
      customer: {
        id: order.customerId,
        name: this.customerName(order),
        mobile: customer?.mobile ?? "",
      },
      items: order.items,
      subtotalCents: order.subtotalCents,
      transportChargeCents: order.transportChargeCents,
      totalCents: order.totalCents,
      fulfilmentType: order.fulfilmentType,
      destination: order.destination,
      vendor: vendor ?? null,
      paymentMethod: order.paymentMethod,
      waybillNumber: order.waybillNumber,
      createdAt: order.createdAt,
      timeline: order.timeline,
    };
  }
}
