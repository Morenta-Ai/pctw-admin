"use client";

import { useActionForm } from "@/hooks/use-action-form";

import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/core/action-result";
import { errorMessage } from "@/core/api/api-error";
import { createCollector } from "@/features/collectors/actions";
import type { CollectorDetail, Hub } from "@/features/collectors/data/models";
import { vehicleLabels, vehicleTypes } from "@/features/dispatch/data/models";

const defaultCapacity = {
  threeWheeler: 120,
  motorbike: 40,
  van: 400,
  lorry: 1000,
} as const;

/** Registers a collector, who then signs in to the collector app with their COL- code. */
export function NewCollectorDialog({ hubs }: { hubs: Hub[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [capacity, setCapacity] = useState("");
  const [state, action, pending] = useActionForm<
    ActionResult<CollectorDetail> | null,
    FormData
  >(async (previous, formData) => {
    const result = await createCollector(previous, formData);
    if (result.ok) {
      toast.success(
        `${result.data.name} registered as ${result.data.code}. They sign in with that code and their mobile.`,
      );
      setOpen(false);
      router.push(`/collectors/${result.data.id}`);
    }
    return result;
  }, null);
  const failed = state && !state.ok ? state : undefined;
  const error = (field: string) => failed?.fieldErrors?.[field];

  const field = (name: string, label: string, input: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`nc-${name}`}>{label}</Label>
      {input}
      {error(name) && <p className="text-xs text-destructive">{error(name)}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          New collector
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={action} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Register a collector</DialogTitle>
            <DialogDescription>
              They get a COL- code to sign in to the collector app with their
              mobile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {field(
              "firstName",
              "First name",
              <Input
                id="nc-firstName"
                name="firstName"
                aria-invalid={Boolean(error("firstName"))}
              />,
            )}
            {field(
              "lastName",
              "Last name",
              <Input
                id="nc-lastName"
                name="lastName"
                aria-invalid={Boolean(error("lastName"))}
              />,
            )}
            {field(
              "mobile",
              "Mobile",
              <Input
                id="nc-mobile"
                name="mobile"
                inputMode="tel"
                placeholder="077 123 4567"
                aria-invalid={Boolean(error("mobile"))}
              />,
            )}
            {field(
              "area",
              "Area",
              <Input
                id="nc-area"
                name="area"
                placeholder="Kotte"
                aria-invalid={Boolean(error("area"))}
              />,
            )}
            {field(
              "hubId",
              "Hub",
              <Select name="hubId">
                <SelectTrigger
                  id="nc-hubId"
                  className="w-full"
                  aria-invalid={Boolean(error("hubId"))}
                >
                  <SelectValue placeholder="Choose a hub" />
                </SelectTrigger>
                <SelectContent>
                  {hubs.map((hub) => (
                    <SelectItem key={hub.id} value={hub.id}>
                      {hub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>,
            )}
            {field(
              "vehicleType",
              "Vehicle",
              <Select
                name="vehicleType"
                onValueChange={(value) =>
                  setCapacity(
                    String(
                      defaultCapacity[value as keyof typeof defaultCapacity],
                    ),
                  )
                }
              >
                <SelectTrigger
                  id="nc-vehicleType"
                  className="w-full"
                  aria-invalid={Boolean(error("vehicleType"))}
                >
                  <SelectValue placeholder="Choose a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {vehicleLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>,
            )}
            {field(
              "plate",
              "Number plate",
              <Input
                id="nc-plate"
                name="plate"
                placeholder="WP ABC-1234"
                aria-invalid={Boolean(error("plate"))}
              />,
            )}
            {field(
              "capacityKg",
              "Carries up to (kg)",
              <Input
                id="nc-capacityKg"
                name="capacityKg"
                inputMode="numeric"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                aria-invalid={Boolean(error("capacityKg"))}
              />,
            )}
          </div>
          {failed && !failed.fieldErrors && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(failed.error)}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Register collector
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
