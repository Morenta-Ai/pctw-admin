import { z } from "zod";

import { roles } from "@/core/auth/roles";
import { accountStatuses } from "@/features/customers/data/models";

export const staffMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(roles),
  status: z.enum(accountStatuses),
  lastSignInAt: z.iso.datetime().nullable(),
});
export type StaffMember = z.infer<typeof staffMemberSchema>;

export const staffListSchema = z.object({ items: z.array(staffMemberSchema) });

export const inviteStaffSchema = z.object({
  name: z.string().trim().min(2, "Enter their name.").max(80),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  role: z.enum(roles, "Choose a role."),
});
export type InviteStaff = z.infer<typeof inviteStaffSchema>;

export const staffChangeSchema = z.union([
  z.object({ role: z.enum(roles) }),
  z.object({ status: z.enum(accountStatuses) }),
]);
export type StaffChange = z.infer<typeof staffChangeSchema>;
