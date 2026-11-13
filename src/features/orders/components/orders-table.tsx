import { ShoppingBag } from "lucide-react";
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
import { formatMoney, formatRelative } from "@/core/format/format";
import type { Paged } from "@/core/paged";
import type { SearchParams } from "@/core/search-params";
import { hrefWith } from "@/core/url";
import type { OrderSummary } from "@/features/orders/data/models";
import {
  fulfilmentLabels,
  orderStatusLabels,
  orderStatusTones,
} from "@/features/orders/data/order-status";

export function OrdersTable({
  page,
  params,
  now,
}: {
  page: Paged<OrderSummary>;
  params: SearchParams;
  now: Date;
}) {
  if (page.totalCount === 0) {
    return (
      <EmptyState icon={ShoppingBag} title="No orders match">
        Try another status, or clear the search.
      </EmptyState>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Fulfilment</TableHead>
            <TableHead>Waybill</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Placed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.items.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link
                  href={`/orders/${order.id}`}
                  className="font-mono text-sm font-semibold text-link hover:underline"
                >
                  {order.id}
                </Link>
                <span className="block text-xs text-muted-foreground">
                  {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                </span>
              </TableCell>
              <TableCell>
                <StatusPill tone={orderStatusTones[order.status]}>
                  {orderStatusLabels[order.status]}
                </StatusPill>
              </TableCell>
              <TableCell className="font-medium">
                {order.customerName}
              </TableCell>
              <TableCell>
                <span className="block">
                  {fulfilmentLabels[order.fulfilmentType]}
                </span>
                {order.vendorName && (
                  <span className="block text-xs text-muted-foreground">
                    {order.vendorName}
                  </span>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {order.waybillNumber ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatMoney(order.totalCents)}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatRelative(order.createdAt, now)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar
        page={page.page}
        pageSize={page.pageSize}
        totalCount={page.totalCount}
        noun="orders"
        hrefForPage={(n) =>
          hrefWith("/orders", params, { page: n === 1 ? null : n })
        }
      />
    </>
  );
}
