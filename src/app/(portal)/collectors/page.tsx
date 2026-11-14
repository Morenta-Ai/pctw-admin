import { Truck } from "lucide-react";
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
import { formatLkMobile, formatWeight } from "@/core/format/format";
import { unwrap } from "@/core/result";
import { flatParams } from "@/core/search-params";
import { hrefWith } from "@/core/url";
import { NewCollectorDialog } from "@/features/collectors/components/new-collector-dialog";
import { getCollectorsRepository } from "@/features/collectors/data/collectors-repository";
import { collectorQuerySchema } from "@/features/collectors/data/models";
import { vehicleLabels } from "@/features/dispatch/data/models";

export const metadata: Metadata = { title: "Collectors" };

export default async function CollectorsPage({
  searchParams,
}: PageProps<"/collectors">) {
  await requireRole();
  const hubs = await getCollectorsRepository().listHubs();

  return (
    <>
      <PageHeader
        title="Collectors"
        description="Field collectors, their vehicles and how much they've collected this week."
        actions={<NewCollectorDialog hubs={hubs.ok ? hubs.data : []} />}
      />
      <Card>
        <CardContent>
          <Suspense fallback={<Skeleton className="mb-4 h-9" />}>
            <ListFilters
              searchLabel="Search collectors"
              searchPlaceholder="Name, COL- code, mobile, area or plate"
              selects={[
                {
                  param: "online",
                  label: "Online",
                  allLabel: "Online and offline",
                  options: [
                    { value: "true", label: "Online now" },
                    { value: "false", label: "Offline" },
                  ],
                },
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
            <CollectorsResults searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}

async function CollectorsResults({
  searchParams,
}: {
  searchParams: PageProps<"/collectors">["searchParams"];
}) {
  const params = await searchParams;
  const page = unwrap(
    await getCollectorsRepository().list(
      collectorQuerySchema.parse(flatParams(params)),
    ),
  );
  if (page.totalCount === 0) {
    return (
      <EmptyState icon={Truck} title="No collectors match">
        Try another search.
      </EmptyState>
    );
  }
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collector</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Hub</TableHead>
            <TableHead className="text-right">This week</TableHead>
            <TableHead className="text-right">Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.items.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link
                  href={`/collectors/${c.id}`}
                  className="font-semibold hover:underline"
                >
                  {c.name}
                </Link>
                <span className="block font-mono text-xs text-muted-foreground">
                  {c.code} · {c.area}
                </span>
              </TableCell>
              <TableCell>
                {c.status === "suspended" ? (
                  <StatusPill tone="danger">Suspended</StatusPill>
                ) : c.online ? (
                  <StatusPill tone="lime" dot>
                    Online
                  </StatusPill>
                ) : (
                  <StatusPill tone="neutral">Offline</StatusPill>
                )}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatLkMobile(c.mobile)}
              </TableCell>
              <TableCell>
                {vehicleLabels[c.vehicle.type]}
                <span className="block text-xs text-muted-foreground">
                  {c.vehicle.plate} · {c.vehicle.capacityKg} kg
                </span>
              </TableCell>
              <TableCell className="text-sm">{c.hub.name}</TableCell>
              <TableCell className="text-right">
                {formatWeight(c.collectedKgThisWeek, 1)}
              </TableCell>
              <TableCell className="text-right">
                ★ {c.rating.toFixed(1)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar
        page={page.page}
        pageSize={page.pageSize}
        totalCount={page.totalCount}
        noun="collectors"
        hrefForPage={(n) =>
          hrefWith("/collectors", params, { page: n === 1 ? null : n })
        }
      />
    </>
  );
}
