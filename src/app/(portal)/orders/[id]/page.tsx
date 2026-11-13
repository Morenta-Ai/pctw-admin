import { ArrowLeft, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/core/auth/session";
import {
  formatDateTime,
  formatLkMobile,
  formatMoney,
} from "@/core/format/format";
import { OrderActions } from "@/features/orders/components/order-actions";
import {
  fulfilmentLabels,
  orderStatusLabels,
  orderStatusTones,
} from "@/features/orders/data/order-status";
import { getOrdersRepository } from "@/features/orders/data/orders-repository";

export async function generateMetadata({
  params,
}: PageProps<"/orders/[id]">): Promise<Metadata> {
  return { title: (await params).id };
}

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  await requireRole();
  const { id } = await params;
  const result = await getOrdersRepository().get(decodeURIComponent(id));
  if (!result.ok) {
    if (result.error.isNotFound) notFound();
    throw result.error;
  }
  const order = result.data;

  return (
    <>
      <Link
        href="/orders"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Orders
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold sm:text-3xl">
              {order.id}
            </h1>
            <StatusPill tone={orderStatusTones[order.status]}>
              {orderStatusLabels[order.status]}
            </StatusPill>
          </div>
          <p className="text-sm text-muted-foreground">
            {fulfilmentLabels[order.fulfilmentType]} · placed{" "}
            {formatDateTime(order.createdAt)} · paid by{" "}
            {order.paymentMethod === "wallet" ? "ReThread wallet" : "card"}
          </p>
        </div>
        <OrderActions order={order} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, i) => (
                  <TableRow key={`${item.productId}-${i}`}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(item.unitPriceCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(item.unitPriceCents * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Subtotal</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(order.subtotalCents)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4}>
                    {order.fulfilmentType === "homeDelivery"
                      ? "Home delivery"
                      : "Click & collect transport"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(order.transportChargeCents)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="font-bold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatMoney(order.totalCents)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <span className="font-semibold">{order.customer.name}</span>
              {order.customer.mobile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-fit"
                  asChild
                >
                  <a href={`tel:${order.customer.mobile}`}>
                    <Phone />
                    {formatLkMobile(order.customer.mobile)}
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{fulfilmentLabels[order.fulfilmentType]}</CardTitle>
              <CardDescription>
                {order.vendor ? "Collect from" : "Deliver to"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col">
                {order.vendor && (
                  <span className="font-semibold">{order.vendor.name}</span>
                )}
                <span className="text-sm">{order.destination}</span>
              </div>
              <div className="flex flex-col rounded-lg bg-muted p-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Waybill
                </span>
                <span className="font-mono text-sm font-semibold">
                  {order.waybillNumber ?? "Issued when the order is confirmed"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3">
                {order.timeline.map((event, i) => (
                  <li key={i} className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {orderStatusLabels[event.status]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.occurredAt)}
                      {event.actor ? ` · ${event.actor}` : " · customer"}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
