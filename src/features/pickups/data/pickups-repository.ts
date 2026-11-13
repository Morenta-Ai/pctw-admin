import "server-only";

import { getAccessToken, getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import type { Paged } from "@/core/paged";
import { guard, type Result } from "@/core/result";
import type {
  PickupDetail,
  PickupQuery,
  PickupSummary,
} from "@/features/pickups/data/models";
import { PickupsMockSource } from "@/features/pickups/data/pickups-mock-source";
import { PickupsRemoteSource } from "@/features/pickups/data/pickups-remote-source";
import type { PickupsSource } from "@/features/pickups/data/pickups-source";
import { getMockWorld } from "@/mock/mock-world";

export type PickupsRepository = {
  list(query: PickupQuery): Promise<Result<Paged<PickupSummary>>>;
  get(id: string): Promise<Result<PickupDetail>>;
  cancel(id: string, reason: string): Promise<Result<PickupDetail>>;
};

export function createPickupsRepository(
  source: PickupsSource,
): PickupsRepository {
  return {
    list: (query) => guard(() => source.list(query)),
    get: (id) => guard(() => source.get(id)),
    cancel: (id, reason) => guard(() => source.cancel(id, reason)),
  };
}

export function getPickupsRepository(): PickupsRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new PickupsMockSource(getMockWorld(), getAccessToken)
    : new PickupsRemoteSource(getApiClient());
  return createPickupsRepository(source);
}
