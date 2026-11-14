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
  payInputSchema,
  rejectInputSchema,
  type Redemption,
} from "@/features/redemptions/data/models";
import { getRedemptionsRepository } from "@/features/redemptions/data/redemptions-repository";

export async function markPaid(
  id: string,
  _previous: ActionResult<Redemption> | null,
  formData: FormData,
): Promise<ActionResult<Redemption>> {
  await requireRole("admin", "callCentre");
  const parsed = payInputSchema.safeParse({
    reference: formData.get("reference") ?? "",
  });
  if (!parsed.success) {
    return actionInvalid({
      reference:
        z.flattenError(parsed.error).fieldErrors.reference?.[0] ??
        "Check this.",
    });
  }
  const result = await getRedemptionsRepository().pay(
    id,
    parsed.data.reference,
  );
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}

export async function rejectRedemption(
  id: string,
  _previous: ActionResult<Redemption> | null,
  formData: FormData,
): Promise<ActionResult<Redemption>> {
  await requireRole("admin", "callCentre");
  const parsed = rejectInputSchema.safeParse({
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return actionInvalid({
      reason:
        z.flattenError(parsed.error).fieldErrors.reason?.[0] ?? "Check this.",
    });
  }
  const result = await getRedemptionsRepository().reject(
    id,
    parsed.data.reason,
  );
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}
