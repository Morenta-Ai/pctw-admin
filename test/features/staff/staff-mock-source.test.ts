import { beforeEach, describe, expect, it } from "vitest";

import { StaffMockSource } from "@/features/staff/data/staff-mock-source";
import {
  createStaffRepository,
  type StaffRepository,
} from "@/features/staff/data/staff-repository";
import { resetMockWorld } from "@/mock/mock-world";

let repo: StaffRepository;

beforeEach(() => {
  repo = createStaffRepository(
    new StaffMockSource(resetMockWorld(), async () => "mock.stf_1.access.1"),
  );
});

describe("staff mock source", () => {
  it("invites a new staff member once per email", async () => {
    const input = {
      name: "Dilini W",
      email: "dilini@rethread.lk",
      role: "callCentre" as const,
    };

    expect(await repo.invite(input)).toMatchObject({
      ok: true,
      data: { status: "active", lastSignInAt: null },
    });
    expect(await repo.invite(input)).toMatchObject({
      ok: false,
      error: { code: "EMAIL_IN_USE" },
    });
  });

  it("changes another member's role or status, but not your own", async () => {
    expect(await repo.update("stf_2", { role: "admin" })).toMatchObject({
      ok: true,
      data: { role: "admin" },
    });
    expect(await repo.update("stf_2", { status: "suspended" })).toMatchObject({
      ok: true,
      data: { status: "suspended" },
    });
    expect(await repo.update("stf_1", { role: "callCentre" })).toMatchObject({
      ok: false,
      error: { code: "CANNOT_CHANGE_SELF" },
    });
  });
});
