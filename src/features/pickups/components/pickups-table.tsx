import { ArrowDown, ArrowUp, ArrowUpDown, PackageSearch } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/app/empty-state";
import { PaginationBar } from "@/components/app/pagination-bar";
import { StatusPill } from "@/components/app/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatRelative,
  formatTimeWindow,
  formatWeekdayDate,
  formatWeight,
} from "@/core/format/format";
import type { Paged } from "@/core/paged";
import { hrefWith } from "@/core/url";
import type { PickupSort, PickupSummary } from "@/features/pickups/data/models";
import {
  pickupSourceLabels,
  pickupStatusLabels,
  pickupStatusTones,
} from "@/features/pickups/data/pickup-status";

type Params = Record<string, string | string[] | undefined>;

export function PickupsTable({
  page,
  params,
  sort,
  now,
}: {
  page: Paged<PickupSummary>;
  params: Params;
  sort: PickupSort;
  now: Date;
}) {
  if (page.totalCount === 0) {
    return (
      <EmptyState icon={PackageSearch} title="No pickups match">
        Try another date or status, or clear the search.
      </EmptyState>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pickup</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>
              <SortLink
                field="scheduledDate"
                label="Scheduled"
                sort={sort}
                params={params}
              />
            </TableHead>
            <TableHead className="text-right">
              <SortLink
                field="estimatedKg"
                label="Weight"
                sort={sort}
                params={params}
              />
            </TableHead>
            <TableHead>Collector</TableHead>
            <TableHead className="text-right">
              <SortLink
                field="createdAt"
                label="Booked"
                sort={sort}
                params={params}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.items.map((pickup) => (
            <TableRow key={pickup.id} className="group">
              <TableCell>
                <Link
                  href={`/pickups/${pickup.id}`}
                  className="font-mono text-sm font-semibold text-link hover:underline"
                >
                  {pickup.id}
                </Link>
                <span className="block text-xs text-muted-foreground">
                  {pickup.method === "bulk" ? "Bulk" : "Itemised"} ·{" "}
                  {pickupSourceLabels[pickup.source]}
                </span>
              </TableCell>
              <TableCell>
                <StatusPill tone={pickupStatusTones[pickup.status]}>
                  {pickupStatusLabels[pickup.status]}
                </StatusPill>
              </TableCell>
              <TableCell>
                <span className="block font-medium">{pickup.customerName}</span>
                <span className="block text-xs text-muted-foreground">
                  {pickup.area}
                </span>
              </TableCell>
              <TableCell>
                <span className="block">
                  {formatWeekdayDate(pickup.windowStart)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatTimeWindow(pickup.windowStart, pickup.windowEnd)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {pickup.actualWeightKg !== null ? (
                  <span className="font-semibold">
                    {formatWeight(pickup.actualWeightKg)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    ~{formatWeight(pickup.estimatedKg, 1)}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {pickup.collector ? (
                  <>
                    <span className="block">{pickup.collector.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {pickup.collector.code}
                    </span>
                  </>
                ) : pickup.status === "pending" ? (
                  <span className="text-sm font-medium text-warning">
                    Unassigned
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatRelative(pickup.createdAt, now)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar
        page={page.page}
        pageSize={page.pageSize}
        totalCount={page.totalCount}
        noun="pickups"
        hrefForPage={(n) =>
          hrefWith("/pickups", params, { page: n === 1 ? null : n })
        }
      />
    </>
  );
}

function SortLink({
  field,
  label,
  sort,
  params,
}: {
  field: "createdAt" | "scheduledDate" | "estimatedKg";
  label: string;
  sort: PickupSort;
  params: Params;
}) {
  const active = sort.replace(/^-/, "") === field;
  const descending = sort.startsWith("-");
  const next = active && descending ? field : `-${field}`;
  const Icon = !active ? ArrowUpDown : descending ? ArrowDown : ArrowUp;

  return (
    <Link
      href={hrefWith("/pickups", params, {
        sort: next === "-createdAt" ? null : next,
        page: null,
      })}
      scroll={false}
      className="inline-flex items-center gap-1 hover:text-foreground"
      aria-label={`Sort by ${label.toLowerCase()}${active ? (descending ? ", currently newest first" : ", currently oldest first") : ""}`}
    >
      {label}
      <Icon className={active ? "size-3.5" : "size-3.5 opacity-40"} />
    </Link>
  );
}
