"use client";

import { useActionForm } from "@/hooks/use-action-form";

import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/core/action-result";
import { errorMessage } from "@/core/api/api-error";
import {
  centsToRupeesInput,
  formatMoney,
  rupeesToCents,
} from "@/core/format/format";
import { saveMultipliers } from "@/features/rates/actions";
import {
  impactLabels,
  isMoneyUnit,
  unitLabels,
  type Multiplier,
  type Multipliers,
} from "@/features/rates/data/models";

const PREVIEW_KG = 10;

function preview(multiplier: Multiplier, raw: string): string {
  if (isMoneyUnit(multiplier.unit)) {
    const cents = rupeesToCents(raw);
    if (cents === null) return "—";
    return multiplier.unit === "usdCents"
      ? `USD ${((cents * PREVIEW_KG) / 100).toFixed(2)}`
      : formatMoney(cents * PREVIEW_KG);
  }
  const value = Number(raw);
  if (raw.trim() === "" || Number.isNaN(value)) return "—";
  const total = Math.round(value * PREVIEW_KG * 100) / 100;
  return `${total.toLocaleString("en-US")} ${unitLabels[multiplier.unit]}`;
}

/** The factors behind the user app's impact screen, with a live "per 10 kg" preview. */
export function MultipliersForm({
  multipliers,
}: {
  multipliers: Multiplier[];
}) {
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(
      multipliers.map((m) => [
        m.key,
        isMoneyUnit(m.unit) ? centsToRupeesInput(m.perKg) : String(m.perKg),
      ]),
    ),
  );
  const units = Object.fromEntries(
    multipliers.map(
      (m) => [m.key, isMoneyUnit(m.unit) ? "money" : "number"] as const,
    ),
  );
  const [state, action, pending] = useActionForm<
    ActionResult<Multipliers> | null,
    FormData
  >(async (previous, formData) => {
    const result = await saveMultipliers(units, previous, formData);
    if (result.ok)
      toast.success(
        "Impact multipliers saved. Customers' impact figures now use them.",
      );
    return result;
  }, null);
  const failed = state && !state.ok ? state : undefined;

  return (
    <form onSubmit={action} className="flex flex-col gap-4">
      <div className="hidden grid-cols-[1fr_12rem_10rem] gap-4 px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase md:grid">
        <span>Metric</span>
        <span>Per kg collected</span>
        <span className="text-right">Per {PREVIEW_KG} kg</span>
      </div>
      <ul className="flex flex-col divide-y">
        {multipliers.map((m) => {
          const label = impactLabels[m.key];
          const error = failed?.fieldErrors?.[m.key];
          return (
            <li
              key={m.key}
              className="grid items-center gap-2 py-3 md:grid-cols-[1fr_12rem_10rem] md:gap-4"
            >
              <label htmlFor={`m-${m.key}`} className="flex flex-col">
                <span className="text-sm font-semibold">{label.title}</span>
                <span className="text-xs text-muted-foreground">
                  {label.detail}
                </span>
              </label>
              <div className="flex flex-col gap-1">
                <div className="relative">
                  <Input
                    id={`m-${m.key}`}
                    name={m.key}
                    inputMode="decimal"
                    value={draft[m.key]}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [m.key]: e.target.value }))
                    }
                    aria-invalid={Boolean(error)}
                    className="pr-20 tabular-nums"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                    {unitLabels[m.unit]}
                  </span>
                </div>
                {error && (
                  <span className="text-xs text-destructive">{error}</span>
                )}
              </div>
              <span className="text-sm font-semibold tabular-nums md:text-right">
                {preview(m, draft[m.key] ?? "")}
              </span>
            </li>
          );
        })}
      </ul>
      {failed && !failed.fieldErrors && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(failed.error)}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save multipliers
        </Button>
      </div>
    </form>
  );
}
