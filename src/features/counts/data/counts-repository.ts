import "server-only";

import { getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import { guard, type Result } from "@/core/result";
import { countsSchema, type Counts } from "@/features/counts/data/models";
import { getMockWorld, type MockWorld } from "@/mock/mock-world";

export type CountsSource = { getCounts(): Promise<Counts> };

export class CountsMockSource implements CountsSource {
  constructor(
    private readonly world: MockWorld,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getCounts(): Promise<Counts> {
    this.world.settleAssignments(this.now());
    return {
      newOrders: this.world.orders.filter((o) => o.status === "placed").length,
      waitingPickups: this.world.pickups.filter((p) => p.status === "pending")
        .length,
      pendingTransfers: this.world.redemptions.filter(
        (r) => r.type === "cash" && r.status === "pending",
      ).length,
    };
  }
}

export function getCountsRepository(): {
  getCounts(): Promise<Result<Counts>>;
} {
  const source: CountsSource = getEnv().USE_MOCK_DATA
    ? new CountsMockSource(getMockWorld())
    : {
        getCounts: () =>
          getApiClient().get("/admin/counts", { schema: countsSchema }),
      };
  return { getCounts: () => guard(() => source.getCounts()) };
}
