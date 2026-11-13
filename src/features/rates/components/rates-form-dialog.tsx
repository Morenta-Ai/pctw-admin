"use client";

import { Loader2, Pencil } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/core/action-result";
import { errorMessage } from "@/core/api/api-error";
import {
  centsToRupeesInput,
  formatDate,
  formatMoney,
  rupeesToCents,
} from "@/core/format/format";
import { saveRates } from "@/features/rates/actions";
import type { RateValues, Rates } from "@/features/rates/data/models";

const fields: { name: keyof RateValues; label: string; hint: string }[] = [
  {
    name: "customerRatePerKgCents",
    label: "Customer earns per kg",
    hint: "Credited to the customer's wallet when the collector weighs their clothes.",
  },
  {
    name: "collectorRatePerKgCents",
    label: "Collector earns per kg",
    hint: "Paid to the collector for each kg collected.",
  },
  {
    name: "homeDeliveryChargeCents",
    label: "Home delivery charge",
    hint: "Added to marketplace orders delivered to the customer.",
  },
  {
    name: "clickAndCollectChargeCents",
    label: "Click & collect transport charge",
    hint: "Added to orders collected from a ReThread point.",
  },
];

export function RatesFormDialog({
  current,
  today,
}: {
  current: RateValues;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(
      fields.map((f) => [f.name, centsToRupeesInput(current[f.name])]),
    ),
  );
  const [state, action, pending] = useActionState<
    ActionResult<Rates> | null,
    FormData
  >(async (previous, formData) => {
    const result = await saveRates(previous, formData);
    if (result.ok) {
      const scheduled = result.data.scheduled;
      toast.success(
        scheduled
          ? `New rates scheduled from ${formatDate(scheduled.effectiveFrom)}.`
          : "New rates are in force now.",
      );
      setOpen(false);
    }
    return result;
  }, null);
  const failed = state && !state.ok ? state : undefined;
  const customer = rupeesToCents(draft.customerRatePerKgCents ?? "");
  const collector = rupeesToCents(draft.collectorRatePerKgCents ?? "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Pencil />
          Change rates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form action={action} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Change rates</DialogTitle>
            <DialogDescription>
              Amounts in rupees. Pickups already booked keep the rates they were
              booked with.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const error = failed?.fieldErrors?.[field.name];
              return (
                <div key={field.name} className="flex flex-col gap-1.5">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                      Rs.
                    </span>
                    <Input
                      id={field.name}
                      name={field.name}
                      inputMode="decimal"
                      value={draft[field.name]}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [field.name]: e.target.value,
                        }))
                      }
                      aria-invalid={Boolean(error)}
                      aria-describedby={`${field.name}-hint`}
                      className="pl-10 tabular-nums"
                    />
                  </div>
                  <p
                    id={`${field.name}-hint`}
                    className={
                      error
                        ? "text-xs text-destructive"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {error ?? field.hint}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="effectiveFrom">Starts on</Label>
            <Input
              id="effectiveFrom"
              name="effectiveFrom"
              type="date"
              min={today}
              defaultValue={today}
              required
              className="w-48"
              aria-invalid={Boolean(failed?.fieldErrors?.effectiveFrom)}
            />
            <p
              className={
                failed?.fieldErrors?.effectiveFrom
                  ? "text-xs text-destructive"
                  : "text-xs text-muted-foreground"
              }
            >
              {failed?.fieldErrors?.effectiveFrom ??
                "Today applies straight away. A later date schedules the change."}
            </p>
          </div>

          {customer !== null && collector !== null && (
            <div className="rounded-lg bg-lime-tint p-3 text-sm text-primary">
              For a 10 kg pickup the customer earns{" "}
              <strong>{formatMoney(customer * 10)}</strong> and the collector{" "}
              <strong>{formatMoney(collector * 10)}</strong>.
            </div>
          )}

          {failed && !failed.fieldErrors && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(failed.error)}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Save rates
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
