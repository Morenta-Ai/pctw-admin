import "server-only";

import { getAccessToken, getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import { guard, type Result } from "@/core/result";
import { AssignmentsMockSource } from "@/features/assignments/data/assignments-mock-source";
import { AssignmentsRemoteSource } from "@/features/assignments/data/assignments-remote-source";
import type { AssignmentsSource } from "@/features/assignments/data/assignments-source";
import type {
  Assignment,
  OfferInput,
} from "@/features/assignments/data/models";
import { getMockWorld } from "@/mock/mock-world";

export type AssignmentsRepository = {
  offer(pickupId: string, input: OfferInput): Promise<Result<Assignment>>;
  listForPickup(pickupId: string): Promise<Result<Assignment[]>>;
  get(id: string): Promise<Result<Assignment>>;
  withdraw(id: string): Promise<Result<Assignment>>;
};

export function createAssignmentsRepository(
  source: AssignmentsSource,
): AssignmentsRepository {
  return {
    offer: (pickupId, input) => guard(() => source.offer(pickupId, input)),
    listForPickup: (pickupId) => guard(() => source.listForPickup(pickupId)),
    get: (id) => guard(() => source.get(id)),
    withdraw: (id) => guard(() => source.withdraw(id)),
  };
}

export function getAssignmentsRepository(): AssignmentsRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new AssignmentsMockSource(getMockWorld(), getAccessToken)
    : new AssignmentsRemoteSource(getApiClient());
  return createAssignmentsRepository(source);
}
