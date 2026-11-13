import { Bell } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { SectionTitle } from "./section-title";
import { StaffMenu } from "./staff-menu";

export function TopBar() {
  const mockData = process.env.USE_MOCK_DATA !== "false";

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <span aria-hidden className="h-5 w-px bg-border" />
      {/* The URL is request data on dynamic routes, so it streams in. */}
      <Suspense>
        <SectionTitle />
      </Suspense>
      <div className="ml-auto flex items-center gap-2">
        {mockData && (
          <StatusPill tone="warning" className="hidden md:inline-flex">
            Mock data
          </StatusPill>
        )}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notifications" aria-label="Notifications">
            <Bell />
          </Link>
        </Button>
        <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
          <StaffMenu />
        </Suspense>
      </div>
    </header>
  );
}
