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
import { cancelPickupInputSchema } from "@/features/pickups/data/models";
import { getPickupsRepository } from "@/features/pickups/data/pickups-repository";

export async function cancelPickup(
  pickupId: string,
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin", "callCentre");

  const parsed = cancelPickupInputSchema.safeParse({
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    return actionInvalid({ reason: fields.reason?.[0] ?? "Check the reason." });
  }

  const result = await getPickupsRepository().cancel(
    pickupId,
    parsed.data.reason,
  );
  if (!result.ok) return actionError(result.error);

  refresh();
  return actionOk(undefined);
}
