import type {
  InviteStaff,
  StaffChange,
  StaffMember,
} from "@/features/staff/data/models";

/** Talks to `/admin/staff`. Throws ApiError on failure. */
export type StaffSource = {
  list(): Promise<StaffMember[]>;
  invite(input: InviteStaff): Promise<StaffMember>;
  update(id: string, change: StaffChange): Promise<StaffMember>;
};
