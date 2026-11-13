import "server-only";

import { getAccessToken, getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import { guard, type Result } from "@/core/result";
import type {
  InviteStaff,
  StaffChange,
  StaffMember,
} from "@/features/staff/data/models";
import { StaffMockSource } from "@/features/staff/data/staff-mock-source";
import { StaffRemoteSource } from "@/features/staff/data/staff-remote-source";
import type { StaffSource } from "@/features/staff/data/staff-source";
import { getMockWorld } from "@/mock/mock-world";

export type StaffRepository = {
  list(): Promise<Result<StaffMember[]>>;
  invite(input: InviteStaff): Promise<Result<StaffMember>>;
  update(id: string, change: StaffChange): Promise<Result<StaffMember>>;
};

export function createStaffRepository(source: StaffSource): StaffRepository {
  return {
    list: () => guard(() => source.list()),
    invite: (input) => guard(() => source.invite(input)),
    update: (id, change) => guard(() => source.update(id, change)),
  };
}

export function getStaffRepository(): StaffRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new StaffMockSource(getMockWorld(), getAccessToken)
    : new StaffRemoteSource(getApiClient());
  return createStaffRepository(source);
}
