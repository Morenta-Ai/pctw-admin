import { Mail, Package, Phone, Scale, Users, Wallet } from "lucide-react";
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
  formatLkMobile,
  formatMoney,
  formatDateKey,
  formatWeight,
} from "@/core/format/format";
import { setCustomerStatus } from "@/features/customers/actions";
import { getCustomersRepository } from "@/features/customers/data/customers-repository";
import {
  pickupStatusLabels,
  pickupStatusTones,
} from "@/features/pickups/data/pickup-status";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({
  params,
}: PageProps<"/customers/[id]">) {
  await requireRole();
  const { id } = await params;
  const result = await getCustomersRepository().get(decodeURIComponent(id));
  if (!result.ok) {
    if (result.error.isNotFound) notFound();
    throw result.error;
  }
  const c = result.data;

  return (
    <>
      <BackLink href="/customers">Customers</BackLink>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold sm:text-3xl">{c.name}</h1>
            <StatusPill tone={c.status === "active" ? "success" : "danger"}>
              {c.status === "active" ? "Active" : "Suspended"}
            </StatusPill>
          </div>
          <p className="text-sm text-muted-foreground">
            {c.address} · customer since {formatDate(c.joinedAt)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${c.mobile}`}>
                <Phone />
                {formatLkMobile(c.mobile)}
              </a>
            </Button>
            {c.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${c.email}`}>
                  <Mail />
                  {c.email}
                </a>
              </Button>
            )}
          </div>
        </div>
        <AccountStatusDialog
          name={c.name}
          suspended={c.status === "suspended"}
          consequence="They can't sign in, book pickups or redeem their wallet until reactivated. Pickups already booked are kept."
          action={setCustomerStatus.bind(null, c.id)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          highlight
          label="Wallet balance"
          value={formatMoney(c.walletBalanceCents)}
          hint={`${formatMoney(c.earnedCents)} earned in all`}
          icon={Wallet}
        />
        <StatCard
          label="Pickups weighed"
          value={c.pickupCount}
          icon={Package}
        />
        <StatCard
          label="Recycled"
          value={formatWeight(c.collectedKg, 1)}
          icon={Scale}
        />
        <StatCard
          label="Family profiles"
          value={c.familyMemberCount}
          hint="For size suggestions"
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent pickups</CardTitle>
        </CardHeader>
        <CardContent>
          {c.recentPickups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pickups yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.recentPickups.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/pickups/${p.id}`}
                        className="font-mono font-semibold text-link hover:underline"
                      >
                        {p.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={pickupStatusTones[p.status]}>
                        {pickupStatusLabels[p.status]}
                      </StatusPill>
                    </TableCell>
                    <TableCell>{formatDateKey(p.scheduledDate)}</TableCell>
                    <TableCell className="text-right">
                      {p.actualWeightKg !== null
                        ? formatWeight(p.actualWeightKg)
                        : `~${formatWeight(p.estimatedKg, 1)}`}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.customerPayoutCents !== null
                        ? formatMoney(p.customerPayoutCents)
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
