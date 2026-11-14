import "server-only";

import { getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import type { Paged } from "@/core/paged";
import { guard, type Result } from "@/core/result";
import { CollectorsMockSource } from "@/features/collectors/data/collectors-mock-source";
import { CollectorsRemoteSource } from "@/features/collectors/data/collectors-remote-source";
import type { CollectorsSource } from "@/features/collectors/data/collectors-source";
import type {
  CollectorDetail,
  CollectorQuery,
  CollectorSummary,
  Hub,
  NewCollectorInput,
} from "@/features/collectors/data/models";
import type { StatusChange } from "@/features/customers/data/models";
import { getMockWorld } from "@/mock/mock-world";

export type CollectorsRepository = {
  list(query: CollectorQuery): Promise<Result<Paged<CollectorSummary>>>;
  get(id: string): Promise<Result<CollectorDetail>>;
  create(input: NewCollectorInput): Promise<Result<CollectorDetail>>;
  setStatus(id: string, change: StatusChange): Promise<Result<CollectorDetail>>;
  listHubs(): Promise<Result<Hub[]>>;
};

export function createCollectorsRepository(
  source: CollectorsSource,
): CollectorsRepository {
  return {
    list: (query) => guard(() => source.list(query)),
    get: (id) => guard(() => source.get(id)),
    create: (input) => guard(() => source.create(input)),
    setStatus: (id, change) => guard(() => source.setStatus(id, change)),
    listHubs: () => guard(() => source.listHubs()),
  };
}

export function getCollectorsRepository(): CollectorsRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new CollectorsMockSource(getMockWorld())
    : new CollectorsRemoteSource(getApiClient());
  return createCollectorsRepository(source);
}
