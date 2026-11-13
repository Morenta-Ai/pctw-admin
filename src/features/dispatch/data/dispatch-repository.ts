import "server-only";

import { getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import { guard, type Result } from "@/core/result";
import { DispatchMockSource } from "@/features/dispatch/data/dispatch-mock-source";
import { DispatchRemoteSource } from "@/features/dispatch/data/dispatch-remote-source";
import type { DispatchSource } from "@/features/dispatch/data/dispatch-source";
import type { Dispatch } from "@/features/dispatch/data/models";
import { getMockWorld } from "@/mock/mock-world";

export type DispatchRepository = {
  getDispatch(): Promise<Result<Dispatch>>;
};

export function createDispatchRepository(
  source: DispatchSource,
): DispatchRepository {
  return { getDispatch: () => guard(() => source.getDispatch()) };
}

export function getDispatchRepository(): DispatchRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new DispatchMockSource(getMockWorld())
    : new DispatchRemoteSource(getApiClient());
  return createDispatchRepository(source);
}
