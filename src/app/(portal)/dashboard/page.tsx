import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";
import { TIME_ZONE } from "@/core/format/format";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const staff = await requireRole();
  const firstName = staff.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`${greeting(new Date())}, ${firstName}`}
        description="Today's pickups, collections, payouts and orders across the ReThread network."
      />
      <ComingSoon step={3}>
        KPI cards for today, a 14-day collection chart and recent activity.
      </ComingSoon>
    </>
  );
}
