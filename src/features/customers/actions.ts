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
import { getCustomersRepository } from "@/features/customers/data/customers-repository";
import {
  statusChangeSchema,
  type CustomerDetail,
} from "@/features/customers/data/models";

export async function setCustomerStatus(
  customerId: string,
  _previous: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<CustomerDetail>> {
  await requireRole("admin", "callCentre");
  const parsed = statusChangeSchema.safeParse({
    status: formData.get("status"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    return actionInvalid({ reason: fields.reason?.[0] ?? "Check the reason." });
  }
  const result = await getCustomersRepository().setStatus(
    customerId,
    parsed.data,
  );
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}
