import "server-only";

import { getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import type { Paged } from "@/core/paged";
import { guard, type Result } from "@/core/result";
import { CustomersMockSource } from "@/features/customers/data/customers-mock-source";
import { CustomersRemoteSource } from "@/features/customers/data/customers-remote-source";
import type { CustomersSource } from "@/features/customers/data/customers-source";
import type {
  CustomerDetail,
  CustomerQuery,
  CustomerSummary,
  StatusChange,
} from "@/features/customers/data/models";
import { getMockWorld } from "@/mock/mock-world";

export type CustomersRepository = {
  list(query: CustomerQuery): Promise<Result<Paged<CustomerSummary>>>;
  get(id: string): Promise<Result<CustomerDetail>>;
  setStatus(id: string, change: StatusChange): Promise<Result<CustomerDetail>>;
};

export function createCustomersRepository(
  source: CustomersSource,
): CustomersRepository {
  return {
    list: (query) => guard(() => source.list(query)),
    get: (id) => guard(() => source.get(id)),
    setStatus: (id, change) => guard(() => source.setStatus(id, change)),
  };
}

export function getCustomersRepository(): CustomersRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new CustomersMockSource(getMockWorld())
    : new CustomersRemoteSource(getApiClient());
  return createCustomersRepository(source);
}
