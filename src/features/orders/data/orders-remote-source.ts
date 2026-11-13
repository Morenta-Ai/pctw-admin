import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import { DEFAULT_PAGE_SIZE } from "@/core/paged";
import {
  orderDetailSchema,
  orderPageSchema,
  type OrderQuery,
} from "@/features/orders/data/models";
import type { OrderStatus } from "@/features/orders/data/order-status";
import type { OrdersSource } from "@/features/orders/data/orders-source";

export class OrdersRemoteSource implements OrdersSource {
  constructor(private readonly api: ApiClient) {}

  list(query: OrderQuery) {
    return this.api.get("/admin/orders", {
      query: { ...query, pageSize: DEFAULT_PAGE_SIZE },
      schema: orderPageSchema,
    });
  }

  get(id: string) {
    return this.api.get(`/admin/orders/${encodeURIComponent(id)}`, {
      schema: orderDetailSchema,
    });
  }

  setStatus(id: string, status: OrderStatus) {
    return this.api.post(`/admin/orders/${encodeURIComponent(id)}/status`, {
      body: { status },
      schema: orderDetailSchema,
    });
  }
}
