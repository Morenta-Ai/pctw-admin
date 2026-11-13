import "server-only";

import { getAccessToken, getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import type { Paged } from "@/core/paged";
import { guard, type Result } from "@/core/result";
import type {
  OrderDetail,
  OrderQuery,
  OrderSummary,
} from "@/features/orders/data/models";
import type { OrderStatus } from "@/features/orders/data/order-status";
import { OrdersMockSource } from "@/features/orders/data/orders-mock-source";
import { OrdersRemoteSource } from "@/features/orders/data/orders-remote-source";
import type { OrdersSource } from "@/features/orders/data/orders-source";
import { getMockWorld } from "@/mock/mock-world";

export type OrdersRepository = {
  list(query: OrderQuery): Promise<Result<Paged<OrderSummary>>>;
  get(id: string): Promise<Result<OrderDetail>>;
  setStatus(id: string, status: OrderStatus): Promise<Result<OrderDetail>>;
};

export function createOrdersRepository(source: OrdersSource): OrdersRepository {
  return {
    list: (query) => guard(() => source.list(query)),
    get: (id) => guard(() => source.get(id)),
    setStatus: (id, status) => guard(() => source.setStatus(id, status)),
  };
}

export function getOrdersRepository(): OrdersRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new OrdersMockSource(getMockWorld(), getAccessToken)
    : new OrdersRemoteSource(getApiClient());
  return createOrdersRepository(source);
}
