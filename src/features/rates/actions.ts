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
import {
  impactKeys,
  newRatesInputSchema,
  type Multipliers,
  type Rates,
} from "@/features/rates/data/models";
import { getRatesRepository } from "@/features/rates/data/rates-repository";

const moneyFields = [
  "customerRatePerKgCents",
  "collectorRatePerKgCents",
  "homeDeliveryChargeCents",
  "clickAndCollectChargeCents",
] as const;

export async function saveRates(
  _previous: ActionResult<Rates> | null,
  formData: FormData,
): Promise<ActionResult<Rates>> {
  await requireRole("admin");

  const errors: Record<string, string> = {};
  const values: Record<string, number> = {};
  for (const field of moneyFields) {
    const cents = rupeesToCents(String(formData.get(field) ?? ""));
    if (cents === null || cents <= 0)
      errors[field] = "Enter an amount above zero, like 120.00.";
    else values[field] = cents;
  }
  if (Object.keys(errors).length > 0) return actionInvalid(errors);

  const parsed = newRatesInputSchema.safeParse({
    ...values,
    effectiveFrom: formData.get("effectiveFrom"),
  });
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    return actionInvalid(
      Object.fromEntries(
        Object.entries(fields).map(([key, messages]) => [
          key,
          key === "effectiveFrom"
            ? "Choose a date."
            : (messages?.[0] ?? "Check this value."),
        ]),
      ),
    );
  }

  const result = await getRatesRepository().setRates(parsed.data);
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}

export async function cancelScheduledRates(): Promise<ActionResult<Rates>> {
  await requireRole("admin");
  const result = await getRatesRepository().cancelScheduled();
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}

export async function saveMultipliers(
  units: Record<string, "money" | "number">,
  _previous: ActionResult<Multipliers> | null,
  formData: FormData,
): Promise<ActionResult<Multipliers>> {
  await requireRole("admin");

  const errors: Record<string, string> = {};
  const items: { key: (typeof impactKeys)[number]; perKg: number }[] = [];
  for (const key of impactKeys) {
    const raw = String(formData.get(key) ?? "").trim();
    if (raw === "") continue;
    if (units[key] === "money") {
      const cents = rupeesToCents(raw);
      if (cents === null) errors[key] = "Use up to 2 decimals, like 0.80.";
      else items.push({ key, perKg: cents });
    } else if (!/^\d+(\.\d{1,4})?$/.test(raw)) {
      errors[key] = "Use a number with up to 4 decimals.";
    } else {
      items.push({ key, perKg: Number(raw) });
    }
  }
  if (Object.keys(errors).length > 0) return actionInvalid(errors);

  const result = await getRatesRepository().updateMultipliers({ items });
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}
