"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import {
  actionError,
  actionInvalid,
  actionOk,
  type ActionResult,
} from "@/core/action-result";
import { requireRole } from "@/core/auth/session";
import {
  inviteStaffSchema,
  staffChangeSchema,
  type StaffMember,
} from "@/features/staff/data/models";
import { getStaffRepository } from "@/features/staff/data/staff-repository";

export async function inviteStaff(
  _previous: ActionResult<StaffMember> | null,
  formData: FormData,
): Promise<ActionResult<StaffMember>> {
  await requireRole("admin");
  const parsed = inviteStaffSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    role: formData.get("role") || undefined,
  });
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    return actionInvalid(
      Object.fromEntries(
        Object.entries(fields).map(([key, messages]) => [
          key,
          messages?.[0] ?? "Check this.",
        ]),
      ),
    );
  }
  const result = await getStaffRepository().invite(parsed.data);
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}

export async function changeStaff(
  staffId: string,
  change: unknown,
): Promise<ActionResult<StaffMember>> {
  await requireRole("admin");
  const result = await getStaffRepository().update(
    staffId,
    staffChangeSchema.parse(change),
  );
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}
