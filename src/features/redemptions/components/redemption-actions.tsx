"use client";

import { useActionForm } from "@/hooks/use-action-form";

import { Check, Loader2, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/core/action-result";
import { errorMessage } from "@/core/api/api-error";
import { formatMoney } from "@/core/format/format";
import { markPaid, rejectRedemption } from "@/features/redemptions/actions";
import type { Redemption } from "@/features/redemptions/data/models";

/** "Mark paid" and "Reject" for a pending bank transfer. */
export function RedemptionActions({ redemption }: { redemption: Redemption }) {
  const who = `${redemption.customer.name}'s ${formatMoney(redemption.amountCents)}`;
  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <ActionDialog
        trigger={
          <Button size="sm">
            <Check />
            Mark paid
          </Button>
        }
        title={`Mark ${who} transfer as paid`}
        description="Make the transfer from the ReThread account first, then enter the bank's reference. The customer is told it's on the way."
        field={{
          name: "reference",
          label: "Bank reference",
          placeholder: "CEFT 1107-88213",
        }}
        submit="Mark paid"
        action={markPaid.bind(null, redemption.id)}
        done={`${redemption.id} marked paid.`}
      />
      <ActionDialog
        destructive
        trigger={
          <Button size="sm" variant="outline">
            <X />
            Reject
          </Button>
        }
        title={`Reject ${who} transfer`}
        description="The amount goes back to the customer's wallet and they see your reason."
        field={{
          name: "reason",
          label: "Reason",
          placeholder: "For example: the account name doesn't match",
          multiline: true,
        }}
        submit="Reject transfer"
        action={rejectRedemption.bind(null, redemption.id)}
        done={`${redemption.id} rejected. The amount is back in the wallet.`}
      />
    </div>
  );
}

function ActionDialog({
  trigger,
  title,
  description,
  field,
  submit,
  action: serverAction,
  done,
  destructive = false,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  field: {
    name: string;
    label: string;
    placeholder: string;
    multiline?: boolean;
  };
  submit: string;
  action: (
    previous: ActionResult<Redemption> | null,
    formData: FormData,
  ) => Promise<ActionResult<Redemption>>;
  done: string;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionForm<
    ActionResult<Redemption> | null,
    FormData
  >(async (previous, formData) => {
    const result = await serverAction(previous, formData);
    if (result.ok) {
      toast.success(done);
      setOpen(false);
    }
    return result;
  }, null);
  const failed = state && !state.ok ? state : undefined;
  const error = failed?.fieldErrors?.[field.name];
  const id = `redemption-${field.name}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={action} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id}>{field.label}</Label>
            {field.multiline ? (
              <Textarea
                id={id}
                name={field.name}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
              />
            ) : (
              <Input
                id={id}
                name={field.name}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
              />
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {failed && !error && (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage(failed.error)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              disabled={pending}
            >
              {pending && <Loader2 className="animate-spin" />}
              {submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
