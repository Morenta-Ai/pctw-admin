import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/app/print-button";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/core/auth/session";
import { Waybill } from "@/features/orders/components/waybill";
import { getOrdersRepository } from "@/features/orders/data/orders-repository";

export async function generateMetadata({
  params,
}: PageProps<"/waybills/[orderId]">): Promise<Metadata> {
  return { title: `Waybill for ${(await params).orderId}` };
}

export default async function WaybillPage({
  params,
}: PageProps<"/waybills/[orderId]">) {
  await requireRole();
  const { orderId } = await params;
  const result = await getOrdersRepository().get(decodeURIComponent(orderId));
  if (!result.ok) {
    if (result.error.isNotFound) notFound();
    throw result.error;
  }
  const order = result.data;

  return (
    <main className="flex flex-col gap-6 p-6 print:p-0">
      <div className="mx-auto flex w-full max-w-[190mm] items-center justify-between print:hidden">
        <Button variant="ghost" asChild>
          <Link href={`/orders/${order.id}`}>
            <ArrowLeft />
            {order.id}
          </Link>
        </Button>
        {order.waybillNumber && <PrintButton label="Print waybill" />}
      </div>
      {order.waybillNumber ? (
        <Waybill order={order} />
      ) : (
        <p className="mx-auto max-w-md text-center text-muted-foreground">
          {order.id} doesn&apos;t have a waybill yet. Confirm the order first.
        </p>
      )}
    </main>
  );
}
