"use client";

import { Ban, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/core/action-result";
import { errorMessage } from "@/core/api/api-error";
import { cancelPickup } from "@/features/pickups/actions";

export function CancelPickupDialog({ pickupId }: { pickupId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<
    ActionResult | null,
    FormData
  >(async (previous, formData) => {
    const result = await cancelPickup(pickupId, previous, formData);
    // Toast here, not in an effect: the refreshed page removes this dialog
    // in the same render that delivers the result.
    if (result.ok) {
      toast.success(`${pickupId} cancelled. The customer has been told.`);
    }
    return result;
  }, null);

  const failed = state && !state.ok ? state : undefined;
  const reasonError = failed?.fieldErrors?.reason;

  return (
    <Dialog open={open && !state?.ok} onOpenChange={(next) => setOpen(next)}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Ban />
          Cancel pickup
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Cancel {pickupId}?</DialogTitle>
            <DialogDescription>
              The customer and any assigned collector are notified. This
              can&apos;t be undone; the customer would need to book again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Textarea
              id="cancel-reason"
              name="reason"
              required
              maxLength={300}
              placeholder="For example: customer called, travelling this week"
              aria-invalid={Boolean(reasonError)}
              aria-describedby={reasonError ? "cancel-reason-error" : undefined}
            />
            {reasonError && (
              <p id="cancel-reason-error" className="text-sm text-destructive">
                {reasonError}
              </p>
            )}
            {failed && !reasonError && (
              <p role="alert" className="text-sm text-destructive">
                {failed.error.code === "PICKUP_NOT_CANCELLABLE"
                  ? "This pickup has already been weighed or cancelled, so it can't be cancelled."
                  : errorMessage(failed.error)}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Keep pickup
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Cancel pickup
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
