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
import { rupeesToCents } from "@/core/format/format";
import { getDonationsRepository } from "@/features/donations/data/donations-repository";
import {
  donationProjectInputSchema,
  type DonationProject,
} from "@/features/donations/data/models";

/** Creates a project, or updates `projectId` when given. */
export async function saveDonationProject(
  projectId: string | null,
  _previous: ActionResult<DonationProject> | null,
  formData: FormData,
): Promise<ActionResult<DonationProject>> {
  await requireRole("admin");
  const goal = rupeesToCents(String(formData.get("goal") ?? ""));
  const parsed = donationProjectInputSchema.safeParse({
    name: formData.get("name") ?? "",
    summary: formData.get("summary") ?? "",
    goalCents: goal ?? Number.NaN,
    active: formData.get("active") === "on",
    endsOn: formData.get("endsOn") || null,
  });
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    const errors: Record<string, string> = {};
    for (const [key, messages] of Object.entries(fields)) {
      if (messages?.[0]) errors[key] = messages[0];
    }
    if (goal === null) errors.goalCents = "Enter a goal like 500000.";
    return actionInvalid(errors);
  }
  const repo = getDonationsRepository();
  const result = projectId
    ? await repo.update(projectId, parsed.data)
    : await repo.create(parsed.data);
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}
