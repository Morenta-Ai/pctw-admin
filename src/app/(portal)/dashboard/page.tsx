import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/core/auth/session";
import { formatDate, TIME_ZONE } from "@/core/format/format";
import { unwrap } from "@/core/result";
import { ActivityFeed } from "@/features/dashboard/components/activity-feed";
import { CollectionsChart } from "@/features/dashboard/components/collections-chart";
import { KpiRow } from "@/features/dashboard/components/kpi-row";
import { OverdueBanner } from "@/features/dashboard/components/overdue-banner";
import { StatusBreakdown } from "@/features/dashboard/components/status-breakdown";
import { getDashboardRepository } from "@/features/dashboard/data/dashboard-repository";

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
  const dashboard = unwrap(await getDashboardRepository().getDashboard());
  const now = new Date();
  const weekKg = dashboard.daily
    .slice(-7)
    .reduce((sum, day) => sum + day.collectedKg, 0);

  return (
    <>
      <PageHeader
        title={`${greeting(now)}, ${staff.name.split(" ")[0]}`}
        description={`${formatDate(now)} · today's pickups, collections and orders across the ReThread network.`}
      />

      <OverdueBanner count={dashboard.unassignedOverdue} />
      <KpiRow dashboard={dashboard} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Collected per day</CardTitle>
            <CardDescription>
              Last 14 days · {Math.round(weekKg).toLocaleString("en-US")} kg in
              the last 7
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CollectionsChart daily={dashboard.daily} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today by status</CardTitle>
            <CardDescription>
              {dashboard.pickupsToday.total} pickups scheduled today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBreakdown counts={dashboard.pickupsToday} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>The latest pickups and orders</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityFeed activity={dashboard.recentActivity} now={now} />
        </CardContent>
      </Card>
    </>
  );
}
