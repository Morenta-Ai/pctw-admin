import "server-only";

import { getAccessToken, getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import type { Paged } from "@/core/paged";
import { guard, type Result } from "@/core/result";
import type {
  Redemption,
  RedemptionQuery,
} from "@/features/redemptions/data/models";
import { RedemptionsMockSource } from "@/features/redemptions/data/redemptions-mock-source";
import { RedemptionsRemoteSource } from "@/features/redemptions/data/redemptions-remote-source";
import type { RedemptionsSource } from "@/features/redemptions/data/redemptions-source";
import { getMockWorld } from "@/mock/mock-world";

export type RedemptionsRepository = {
  list(query: RedemptionQuery): Promise<Result<Paged<Redemption>>>;
  pay(id: string, reference: string): Promise<Result<Redemption>>;
  reject(id: string, reason: string): Promise<Result<Redemption>>;
};

export function createRedemptionsRepository(
  source: RedemptionsSource,
): RedemptionsRepository {
  return {
    list: (query) => guard(() => source.list(query)),
    pay: (id, reference) => guard(() => source.pay(id, reference)),
    reject: (id, reason) => guard(() => source.reject(id, reason)),
  };
}

export function getRedemptionsRepository(): RedemptionsRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new RedemptionsMockSource(getMockWorld(), getAccessToken)
    : new RedemptionsRemoteSource(getApiClient());
  return createRedemptionsRepository(source);
}
