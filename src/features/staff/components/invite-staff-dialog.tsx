"use client";

import { useActionForm } from "@/hooks/use-action-form";

import { Loader2, MailPlus } from "lucide-react";
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
import { roleLabels, roles } from "@/core/auth/roles";
import { inviteStaff } from "@/features/staff/actions";
import type { StaffMember } from "@/features/staff/data/models";

export function InviteStaffDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionForm<
    ActionResult<StaffMember> | null,
    FormData
  >(async (previous, formData) => {
    const result = await inviteStaff(previous, formData);
    if (result.ok) {
      toast.success(`Invite sent to ${result.data.email}.`);
      setOpen(false);
    }
    return result;
  }, null);
  const failed = state && !state.ok ? state : undefined;
  const error = (name: string) => failed?.fieldErrors?.[name];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <MailPlus />
          Invite staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={action} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Invite a staff member</DialogTitle>
            <DialogDescription>
              They get an email to set their password and sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-name">Name</Label>
            <Input
              id="invite-name"
              name="name"
              aria-invalid={Boolean(error("name"))}
            />
            {error("name") && (
              <p className="text-xs text-destructive">{error("name")}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Work email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              aria-invalid={Boolean(error("email"))}
            />
            {error("email") && (
              <p className="text-xs text-destructive">{error("email")}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select name="role" defaultValue="callCentre">
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Call Centre handles dispatch, pickups, orders, customers and
              collectors. Admins can also change rates, the catalogue, donation
              campaigns and staff.
            </p>
          </div>
          {failed && !failed.fieldErrors && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(failed.error)}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
