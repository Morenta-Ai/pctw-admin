import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import {
  staffListSchema,
  staffMemberSchema,
  type InviteStaff,
  type StaffChange,
} from "@/features/staff/data/models";
import type { StaffSource } from "@/features/staff/data/staff-source";

export class StaffRemoteSource implements StaffSource {
  constructor(private readonly api: ApiClient) {}

  async list() {
    return (await this.api.get("/admin/staff", { schema: staffListSchema }))
      .items;
  }

  invite(input: InviteStaff) {
    return this.api.post("/admin/staff", {
      body: input,
      schema: staffMemberSchema,
    });
  }

  update(id: string, change: StaffChange) {
    return this.api.patch(`/admin/staff/${encodeURIComponent(id)}`, {
      body: change,
      schema: staffMemberSchema,
    });
  }
}
