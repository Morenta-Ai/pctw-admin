"use client";

import { useActionForm } from "@/hooks/use-action-form";

import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { useState } from "react";
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

/**
 * Suspend (with a reason) or reactivate an account. `action` is a Server
 * Action already bound to the account, reading `status` and `reason`.
 */
export function AccountStatusDialog({
  name,
  suspended,
  consequence,
  action: serverAction,
}: {
  name: string;
  suspended: boolean;
  /** What suspending does, such as "They can't sign in or book pickups." */
  consequence: string;
  action: (
    previous: ActionResult<unknown> | null,
    formData: FormData,
  ) => Promise<ActionResult<unknown>>;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionForm<
    ActionResult<unknown> | null,
    FormData
  >(async (previous, formData) => {
    const result = await serverAction(previous, formData);
    if (result.ok) {
      toast.success(
        suspended ? `${name} is active again.` : `${name} is suspended.`,
      );
      setOpen(false);
    }
    return result;
  }, null);
  const failed = state && !state.ok ? state : undefined;
  const reasonError = failed?.fieldErrors?.reason;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {suspended ? (
          <Button variant="outline">
            <ShieldCheck />
            Reactivate
          </Button>
        ) : (
          <Button variant="destructive">
            <ShieldOff />
            Suspend
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={action} className="flex flex-col gap-4">
          <input
            type="hidden"
            name="status"
            value={suspended ? "active" : "suspended"}
          />
          <DialogHeader>
            <DialogTitle>
              {suspended ? `Reactivate ${name}?` : `Suspend ${name}?`}
            </DialogTitle>
            <DialogDescription>
              {suspended
                ? "They can use ReThread again straight away."
                : consequence}
            </DialogDescription>
          </DialogHeader>
          {!suspended && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="status-reason">Reason</Label>
              <Textarea
                id="status-reason"
                name="reason"
                maxLength={300}
                aria-invalid={Boolean(reasonError)}
                placeholder="Kept on the account for other staff to see"
              />
              {reasonError && (
                <p className="text-sm text-destructive">{reasonError}</p>
              )}
            </div>
          )}
          {failed && !reasonError && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(failed.error)}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant={suspended ? "default" : "destructive"}
              disabled={pending}
            >
              {pending && <Loader2 className="animate-spin" />}
              {suspended ? "Reactivate" : "Suspend"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
