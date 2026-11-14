import { Users } from "lucide-react";
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
  formatDate,
  formatLkMobile,
  formatMoney,
  formatWeight,
} from "@/core/format/format";
import { unwrap } from "@/core/result";
import { flatParams } from "@/core/search-params";
import { hrefWith } from "@/core/url";
import { getCustomersRepository } from "@/features/customers/data/customers-repository";
import { customerQuerySchema } from "@/features/customers/data/models";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: PageProps<"/customers">) {
  await requireRole();
  return (
    <>
      <PageHeader
        title="Customers"
        description="People who recycle with the ReThread app: their pickups, earnings and wallet."
      />
      <Card>
        <CardContent>
          <Suspense fallback={<Skeleton className="mb-4 h-9" />}>
            <ListFilters
              searchLabel="Search customers"
              searchPlaceholder="Name, mobile, email or area"
              selects={[
                {
                  param: "status",
                  label: "Status",
                  allLabel: "Any status",
                  options: [
                    { value: "active", label: "Active" },
                    { value: "suspended", label: "Suspended" },
                  ],
                },
              ]}
            />
          </Suspense>
          <Suspense fallback={<TableSkeleton />}>
            <CustomersResults searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}

async function CustomersResults({
  searchParams,
}: {
  searchParams: PageProps<"/customers">["searchParams"];
}) {
  const params = await searchParams;
  const page = unwrap(
    await getCustomersRepository().list(
      customerQuerySchema.parse(flatParams(params)),
    ),
  );
  if (page.totalCount === 0) {
    return (
      <EmptyState icon={Users} title="No customers match">
        Try another search.
      </EmptyState>
    );
  }
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Area</TableHead>
            <TableHead className="text-right">Pickups</TableHead>
            <TableHead className="text-right">Recycled</TableHead>
            <TableHead className="text-right">Wallet</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.items.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link
                  href={`/customers/${c.id}`}
                  className="font-semibold hover:underline"
                >
                  {c.name}
                </Link>
                {c.status === "suspended" && (
                  <StatusPill tone="danger" className="ml-2">
                    Suspended
                  </StatusPill>
                )}
                {c.email && (
                  <span className="block text-xs text-muted-foreground">
                    {c.email}
                  </span>
                )}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatLkMobile(c.mobile)}
              </TableCell>
              <TableCell>{c.area}</TableCell>
              <TableCell className="text-right">{c.pickupCount}</TableCell>
              <TableCell className="text-right">
                {formatWeight(c.collectedKg, 1)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatMoney(c.walletBalanceCents)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(c.joinedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar
        page={page.page}
        pageSize={page.pageSize}
        totalCount={page.totalCount}
        noun="customers"
        hrefForPage={(n) =>
          hrefWith("/customers", params, { page: n === 1 ? null : n })
        }
      />
    </>
  );
}
