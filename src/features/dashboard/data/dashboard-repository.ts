import "server-only";

import { getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import { guard, type Result } from "@/core/result";
import { DashboardMockSource } from "@/features/dashboard/data/dashboard-mock-source";
import { DashboardRemoteSource } from "@/features/dashboard/data/dashboard-remote-source";
import type { DashboardSource } from "@/features/dashboard/data/dashboard-source";
import type { Dashboard } from "@/features/dashboard/data/models";
import { getMockWorld } from "@/mock/mock-world";

export type DashboardRepository = {
  getDashboard(): Promise<Result<Dashboard>>;
};

export function createDashboardRepository(
  source: DashboardSource,
): DashboardRepository {
  return { getDashboard: () => guard(() => source.getDashboard()) };
}

export function getDashboardRepository(): DashboardRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new DashboardMockSource(getMockWorld())
    : new DashboardRemoteSource(getApiClient());
  return createDashboardRepository(source);
}
