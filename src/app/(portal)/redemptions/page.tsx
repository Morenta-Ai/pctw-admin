import { Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/app/empty-state";
import { ListFilters } from "@/components/app/list-filters";
import { PageHeader } from "@/components/app/page-header";
import { PaginationBar } from "@/components/app/pagination-bar";
import { StatusPill } from "@/components/app/status-pill";
import { TableSkeleton } from "@/components/app/table-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  formatDateTime,
  formatMoney,
  formatRelative,
} from "@/core/format/format";
import { unwrap } from "@/core/result";
import { flatParams } from "@/core/search-params";
import { hrefWith } from "@/core/url";
import { RedemptionActions } from "@/features/redemptions/components/redemption-actions";
import {
  redemptionQuerySchema,
  redemptionStatuses,
  redemptionStatusLabels,
  redemptionTypeLabels,
  redemptionTypes,
  type Redemption,
} from "@/features/redemptions/data/models";
import { getRedemptionsRepository } from "@/features/redemptions/data/redemptions-repository";

export const metadata: Metadata = { title: "Redemptions" };

export default async function RedemptionsPage({
  searchParams,
}: PageProps<"/redemptions">) {
  await requireRole();
  return (
    <>
      <PageHeader
        title="Redemptions"
        description="What customers did with their wallet. Bank transfers wait here until someone makes the transfer and marks it paid."
      />
      <Suspense fallback={<Skeleton className="h-20 rounded-xl" />}>
        <TransferQueue />
      </Suspense>
      <Card>
        <CardContent>
          <Suspense fallback={<Skeleton className="mb-4 h-9" />}>
            <ListFilters
              searchLabel="Search redemptions"
              searchPlaceholder="Customer, mobile or bank reference"
              selects={[
                {
                  param: "type",
                  label: "Type",
                  allLabel: "All types",
                  options: redemptionTypes.map((t) => ({
                    value: t,
                    label: redemptionTypeLabels[t],
                  })),
                },
                {
                  param: "status",
                  label: "Status",
                  allLabel: "Any status",
                  options: redemptionStatuses.map((s) => ({
                    value: s,
                    label: redemptionStatusLabels[s][0],
                  })),
                },
              ]}
            />
          </Suspense>
          <Suspense fallback={<TableSkeleton />}>
            <RedemptionResults searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}

/** The call to action: how many transfers are waiting, and for how much. */
async function TransferQueue() {
  const result = await getRedemptionsRepository().list({
    type: "cash",
    status: "pending",
  });
  if (!result.ok || result.data.totalCount === 0) return null;
  const total = result.data.items.reduce((sum, r) => sum + r.amountCents, 0);
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-warning-bg p-4 text-warning sm:flex-row sm:items-center">
      <Wallet className="size-5 shrink-0" />
      <p className="text-sm font-semibold">
        {result.data.totalCount} bank transfer
        {result.data.totalCount === 1 ? "" : "s"} to make · {formatMoney(total)}
      </p>
      <Link
        href="/redemptions?type=cash&status=pending"
        className="text-sm font-semibold underline sm:ml-auto"
      >
        Show the queue
      </Link>
    </div>
  );
}

async function RedemptionResults({
  searchParams,
}: {
  searchParams: PageProps<"/redemptions">["searchParams"];
}) {
  const params = await searchParams;
  const page = unwrap(
    await getRedemptionsRepository().list(
      redemptionQuerySchema.parse(flatParams(params)),
    ),
  );
  const now = new Date();
  if (page.totalCount === 0) {
    return (
      <EmptyState icon={Wallet} title="Nothing here">
        No redemptions match these filters.
      </EmptyState>
    );
  }
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.items.map((r) => {
            const [label, tone] = redemptionStatusLabels[r.status];
            return (
              <TableRow key={r.id}>
                <TableCell>
                  <Link
                    href={`/customers/${r.customer.id}`}
                    className="font-semibold hover:underline"
                  >
                    {r.customer.name}
                  </Link>
                  <span className="block font-mono text-xs text-muted-foreground">
                    {r.id}
                  </span>
                </TableCell>
                <TableCell>{redemptionTypeLabels[r.type]}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatMoney(r.amountCents)}
                </TableCell>
                <TableCell className="text-sm">
                  <Details redemption={r} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatRelative(r.requestedAt, now)}
                </TableCell>
                <TableCell>
                  <StatusPill tone={tone}>{label}</StatusPill>
                  {r.processedBy && r.processedAt && r.type === "cash" && (
                    <span className="block text-xs text-muted-foreground">
                      {r.processedBy} · {formatDateTime(r.processedAt)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {r.type === "cash" && r.status === "pending" && (
                    <RedemptionActions redemption={r} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <PaginationBar
        page={page.page}
        pageSize={page.pageSize}
        totalCount={page.totalCount}
        noun="redemptions"
        hrefForPage={(n) =>
          hrefWith("/redemptions", params, { page: n === 1 ? null : n })
        }
      />
    </>
  );
}

function Details({ redemption: r }: { redemption: Redemption }) {
  if (r.bank) {
    return (
      <>
        <span className="block">
          {r.bank.bankName}, {r.bank.branch}
        </span>
        <span className="block text-xs text-muted-foreground">
          {r.bank.accountName} ·{" "}
          <span className="font-mono">{r.bank.accountNumber}</span>
        </span>
        {r.reference && (
          <span className="block font-mono text-xs">Ref {r.reference}</span>
        )}
        {r.rejectReason && (
          <span className="block text-xs text-destructive">
            {r.rejectReason}
          </span>
        )}
      </>
    );
  }
  if (r.voucher) {
    return (
      <>
        <span className="block">{r.voucher.brandName}</span>
        <span className="block font-mono text-xs text-muted-foreground">
          {r.voucher.code}
        </span>
      </>
    );
  }
  return <span>{r.donation?.projectName ?? "—"}</span>;
}
