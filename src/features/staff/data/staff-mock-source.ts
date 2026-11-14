import "server-only";

import { ApiError } from "@/core/api/api-error";
import type {
  InviteStaff,
  StaffChange,
  StaffMember,
} from "@/features/staff/data/models";
import type { StaffSource } from "@/features/staff/data/staff-source";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import type { MockStaffAccount } from "@/mock/seed/staff";

/** Invited staff sign in with this in mock mode; the real API emails a set-password link. */
export const MOCK_INVITE_PASSWORD = "rethread-welcome";

export class StaffMockSource implements StaffSource {
  constructor(
    private readonly world: MockWorld,
    private readonly getAccessToken: () => Promise<string | undefined>,
  ) {}

  async list() {
    await mockLatency();
    return this.world.staff.map(toMember);
  }

  async invite(input: InviteStaff) {
    await mockLatency(300);
    if (this.world.staff.some((s) => s.email === input.email)) {
      throw new ApiError({
        code: "EMAIL_IN_USE",
        message: "Someone already has a staff account with this email.",
        status: 409,
      });
    }
    const account: MockStaffAccount = {
      id: this.world.nextId("stf"),
      ...input,
      status: "active",
      password: MOCK_INVITE_PASSWORD,
      lastSignInAt: null,
    };
    this.world.staff.push(account);
    return toMember(account);
  }

  async update(id: string, change: StaffChange) {
    await mockLatency(300);
    const me = this.world.staffForToken(await this.getAccessToken());
    if (me?.id === id) {
      throw new ApiError({
        code: "CANNOT_CHANGE_SELF",
        message: "Ask another admin to change your own role or status.",
        status: 409,
      });
    }
    const account = this.world.staff.find((s) => s.id === id);
    if (!account) {
      throw new ApiError({
        code: "STAFF_NOT_FOUND",
        message: `No staff ${id}.`,
        status: 404,
      });
    }
    Object.assign(account, change);
    return toMember(account);
  }
}

const toMember = ({
  id,
  name,
  email,
  role,
  status,
  lastSignInAt,
}: MockStaffAccount): StaffMember => ({
  id,
  name,
  email,
  role,
  status,
  lastSignInAt,
});
