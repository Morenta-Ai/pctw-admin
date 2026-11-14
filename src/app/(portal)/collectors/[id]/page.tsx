import { CalendarDays, Package, Phone, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountStatusDialog } from "@/components/app/account-status-dialog";
import { BackLink } from "@/components/app/back-link";
import { StatCard } from "@/components/app/stat-card";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/core/auth/session";
import {
  formatDate,
  formatDateKey,
  formatLkMobile,
  formatMoney,
  formatWeight,
} from "@/core/format/format";
import { setCollectorStatus } from "@/features/collectors/actions";
import { getCollectorsRepository } from "@/features/collectors/data/collectors-repository";
import { vehicleLabels } from "@/features/dispatch/data/models";
import {
  pickupStatusLabels,
  pickupStatusTones,
} from "@/features/pickups/data/pickup-status";

export const metadata: Metadata = { title: "Collector" };

export default async function CollectorPage({
  params,
}: PageProps<"/collectors/[id]">) {
  await requireRole();
  const { id } = await params;
  const result = await getCollectorsRepository().get(decodeURIComponent(id));
  if (!result.ok) {
    if (result.error.isNotFound) notFound();
    throw result.error;
  }
  const c = result.data;

  return (
    <>
      <BackLink href="/collectors">Collectors</BackLink>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold sm:text-3xl">{c.name}</h1>
            <span className="font-mono text-lg text-muted-foreground">
              {c.code}
            </span>
            {c.status === "suspended" ? (
              <StatusPill tone="danger">Suspended</StatusPill>
            ) : c.online ? (
              <StatusPill tone="lime" dot>
                Online
              </StatusPill>
            ) : (
              <StatusPill tone="neutral">Offline</StatusPill>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {vehicleLabels[c.vehicle.type]} {c.vehicle.plate} · carries{" "}
            {c.vehicle.capacityKg} kg · {c.area} · drops at {c.hub.name} · since{" "}
            {formatDate(`${c.memberSince}T06:30:00Z`)} · ★ {c.rating.toFixed(1)}
          </p>
          <Button variant="outline" size="sm" className="w-fit" asChild>
            <a href={`tel:${c.mobile}`}>
              <Phone />
              {formatLkMobile(c.mobile)}
            </a>
          </Button>
        </div>
        <AccountStatusDialog
          name={c.name}
          suspended={c.status === "suspended"}
          consequence="They're taken offline, open offers are withdrawn, and they can't sign in to the collector app until reactivated."
          action={setCollectorStatus.bind(null, c.id)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          highlight
          label="Earned today"
          value={formatMoney(c.earnings.todayCents)}
          icon={Wallet}
        />
        <StatCard
          label="This week"
          value={formatMoney(c.earnings.weekCents)}
          hint={`${formatWeight(c.collectedKgThisWeek, 1)} collected since Monday`}
          icon={CalendarDays}
        />
        <StatCard
          label="This month"
          value={formatMoney(c.earnings.monthCents)}
          icon={CalendarDays}
        />
        <StatCard
          label="Carrying now"
          value={formatWeight(c.loadKg, 1)}
          hint={`of ${c.vehicle.capacityKg} kg, not yet at the hub`}
          icon={Package}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {c.recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-right">Weighed</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link
                        href={`/pickups/${job.id}`}
                        className="font-mono font-semibold text-link hover:underline"
                      >
                        {job.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={pickupStatusTones[job.status]}>
                        {pickupStatusLabels[job.status]}
                      </StatusPill>
                    </TableCell>
                    <TableCell>{formatDateKey(job.scheduledDate)}</TableCell>
                    <TableCell>{job.area}</TableCell>
                    <TableCell className="text-right">
                      {job.actualWeightKg !== null
                        ? formatWeight(job.actualWeightKg)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {job.collectorPayoutCents !== null
                        ? formatMoney(job.collectorPayoutCents)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
