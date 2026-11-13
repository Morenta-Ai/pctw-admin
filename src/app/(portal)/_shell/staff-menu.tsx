import { LogOut } from "lucide-react";

import { StatusPill } from "@/components/app/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roleLabels } from "@/core/auth/roles";
import { requireStaff } from "@/core/auth/session";
import { initials } from "@/core/format/format";
import { logout } from "@/features/auth/actions";

/** The signed-in staff member, with sign out. Reads the session. */
export async function StaffMenu() {
  const staff = await requireStaff();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-3 rounded-lg p-1 pr-2 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`Account menu for ${staff.name}`}
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-lime text-xs font-bold text-lime-foreground">
            {initials(staff.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-sm font-semibold">{staff.name}</span>
          <span className="text-xs text-muted-foreground">
            {roleLabels[staff.role]}
          </span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="font-semibold">{staff.name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {staff.email}
          </span>
          <StatusPill tone={staff.role === "admin" ? "navy" : "cyan"}>
            {roleLabels[staff.role]}
          </StatusPill>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
