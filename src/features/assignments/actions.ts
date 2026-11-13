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
import { getAssignmentsRepository } from "@/features/assignments/data/assignments-repository";
import {
  offerInputSchema,
  type Assignment,
} from "@/features/assignments/data/models";

export async function offerPickup(
  pickupId: string,
  _previous: ActionResult<Assignment> | null,
  formData: FormData,
): Promise<ActionResult<Assignment>> {
  await requireRole("admin", "callCentre");

  const parsed = offerInputSchema.safeParse({
    collectorId: formData.get("collectorId") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    return actionInvalid({
      ...(fields.collectorId ? { collectorId: fields.collectorId[0]! } : {}),
      ...(fields.note ? { note: fields.note[0]! } : {}),
    });
  }

  const result = await getAssignmentsRepository().offer(pickupId, parsed.data);
  return result.ok ? actionOk(result.data) : actionError(result.error);
}

export async function withdrawOffer(
  assignmentId: string,
): Promise<ActionResult<Assignment>> {
  await requireRole("admin", "callCentre");
  const result = await getAssignmentsRepository().withdraw(assignmentId);
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}
