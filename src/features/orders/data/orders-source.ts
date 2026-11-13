import type { Paged } from "@/core/paged";
import type {
  OrderDetail,
  OrderQuery,
  OrderSummary,
} from "@/features/orders/data/models";
import type { OrderStatus } from "@/features/orders/data/order-status";

/** Talks to `/admin/orders`. Throws ApiError on failure. */
export type OrdersSource = {
  list(query: OrderQuery): Promise<Paged<OrderSummary>>;
  get(id: string): Promise<OrderDetail>;
  setStatus(id: string, status: OrderStatus): Promise<OrderDetail>;
};
