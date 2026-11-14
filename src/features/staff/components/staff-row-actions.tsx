"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errorMessage } from "@/core/api/api-error";
import { roleLabels, roles, type Role } from "@/core/auth/roles";
import { changeStaff } from "@/features/staff/actions";
import type { StaffMember } from "@/features/staff/data/models";

/** Role and status controls for someone else's account. */
export function StaffRowActions({ member }: { member: StaffMember }) {
  const [pending, start] = useTransition();
  const run = (
    change: { role: Role } | { status: "active" | "suspended" },
    done: string,
  ) =>
    start(async () => {
      const result = await changeStaff(member.id, change);
      if (result.ok) toast.success(done);
      else toast.error(errorMessage(result.error));
    });

  return (
    <div className="flex items-center justify-end gap-2">
      <Select
        value={member.role}
        disabled={pending}
        onValueChange={(role) =>
          run(
            { role: role as Role },
            `${member.name} is now ${roleLabels[role as Role]}.`,
          )
        }
      >
        <SelectTrigger
          aria-label={`Role for ${member.name}`}
          className="h-8 w-36"
        >
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
      {member.status === "active" ? (
        <Button
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(
              { status: "suspended" },
              `${member.name} can no longer sign in.`,
            )
          }
        >
          Suspend
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            run({ status: "active" }, `${member.name} can sign in again.`)
          }
        >
          Reactivate
        </Button>
      )}
    </div>
  );
}
