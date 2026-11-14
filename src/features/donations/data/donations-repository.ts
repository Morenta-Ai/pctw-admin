import "server-only";

import { getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import { guard, type Result } from "@/core/result";
import { DonationsMockSource } from "@/features/donations/data/donations-mock-source";
import { DonationsRemoteSource } from "@/features/donations/data/donations-remote-source";
import type { DonationsSource } from "@/features/donations/data/donations-source";
import type {
  DonationProject,
  DonationProjectInput,
} from "@/features/donations/data/models";
import { getMockWorld } from "@/mock/mock-world";

export type DonationsRepository = {
  list(): Promise<Result<DonationProject[]>>;
  create(input: DonationProjectInput): Promise<Result<DonationProject>>;
  update(
    id: string,
    input: Partial<DonationProjectInput>,
  ): Promise<Result<DonationProject>>;
};

export function createDonationsRepository(
  source: DonationsSource,
): DonationsRepository {
  return {
    list: () => guard(() => source.list()),
    create: (input) => guard(() => source.create(input)),
    update: (id, input) => guard(() => source.update(id, input)),
  };
}

export function getDonationsRepository(): DonationsRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new DonationsMockSource(getMockWorld())
    : new DonationsRemoteSource(getApiClient());
  return createDonationsRepository(source);
}
