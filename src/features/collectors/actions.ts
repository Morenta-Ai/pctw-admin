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
import { getCollectorsRepository } from "@/features/collectors/data/collectors-repository";
import {
  newCollectorInputSchema,
  type CollectorDetail,
} from "@/features/collectors/data/models";
import { statusChangeSchema } from "@/features/customers/data/models";

export async function createCollector(
  _previous: ActionResult<CollectorDetail> | null,
  formData: FormData,
): Promise<ActionResult<CollectorDetail>> {
  await requireRole("admin", "callCentre");
  const capacity = String(formData.get("capacityKg") ?? "").trim();
  const parsed = newCollectorInputSchema.safeParse({
    firstName: formData.get("firstName") ?? "",
    lastName: formData.get("lastName") ?? "",
    mobile: formData.get("mobile") ?? "",
    area: formData.get("area") ?? "",
    hubId: formData.get("hubId") ?? "",
    vehicle: {
      type: formData.get("vehicleType") || undefined,
      plate: formData.get("plate") ?? "",
      capacityKg: /^\d+$/.test(capacity) ? Number(capacity) : Number.NaN,
    },
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      // vehicle.plate → plate, so errors line up with the form's field names.
      const key = String(
        issue.path.at(-1) === "type" ? "vehicleType" : issue.path.at(-1),
      );
      errors[key] ??= issue.message.startsWith("Invalid input")
        ? "Check this value."
        : issue.message;
    }
    return actionInvalid(errors);
  }
  const result = await getCollectorsRepository().create(parsed.data);
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}

export async function setCollectorStatus(
  collectorId: string,
  _previous: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<CollectorDetail>> {
  await requireRole("admin", "callCentre");
  const parsed = statusChangeSchema.safeParse({
    status: formData.get("status"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    return actionInvalid({ reason: fields.reason?.[0] ?? "Check the reason." });
  }
  const result = await getCollectorsRepository().setStatus(
    collectorId,
    parsed.data,
  );
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}
