import Link from "next/link";
import { Suspense } from "react";

import { AppLogo, AppLogoMark } from "@/components/app/app-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/core/auth/session";

import { PortalNav } from "./portal-nav";

export function PortalSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Link href="/dashboard" aria-label="ReThread Admin home">
          <AppLogo
            label="Admin"
            className="group-data-[collapsible=icon]:hidden"
          />
          <AppLogoMark className="hidden size-8 text-base group-data-[collapsible=icon]:inline-flex" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<NavSkeleton />}>
          <RoleNav />
        </Suspense>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

/** Reads the session, so it streams in behind the sidebar's static frame. */
async function RoleNav() {
  const staff = await requireStaff();
  return <PortalNav role={staff.role} />;
}

// Fixed widths: shadcn's SidebarMenuSkeleton uses Math.random(), which
// can't be part of a prerendered shell.
const skeletonWidths = ["70%", "55%", "80%", "60%", "75%", "50%", "65%", "72%"];

function NavSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4" aria-hidden>
      {skeletonWidths.map((width, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-md bg-sidebar-accent" />
          <Skeleton className="h-4 bg-sidebar-accent" style={{ width }} />
        </div>
      ))}
    </div>
  );
}
