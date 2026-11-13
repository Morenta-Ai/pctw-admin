import type { Metadata } from "next";
import { Suspense } from "react";

import { ListFilters } from "@/components/app/list-filters";
import { PageHeader } from "@/components/app/page-header";
import { TableSkeleton } from "@/components/app/table-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/core/auth/session";
import { unwrap } from "@/core/result";
import { flatParams } from "@/core/search-params";
import { OrdersTable } from "@/features/orders/components/orders-table";
import { orderQuerySchema } from "@/features/orders/data/models";
import {
  fulfilmentLabels,
  fulfilmentTypes,
  orderStatuses,
  orderStatusLabels,
} from "@/features/orders/data/order-status";
import { getOrdersRepository } from "@/features/orders/data/orders-repository";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({
  searchParams,
}: PageProps<"/orders">) {
  await requireRole();

  return (
    <>
      <PageHeader
        title="Orders"
        description="Rejuvenated-garment orders from the app. Confirm new orders to create their waybill, then send them out or ready them at the click & collect point."
      />
      <Card>
        <CardContent>
          <Suspense fallback={<Skeleton className="mb-4 h-9" />}>
            <ListFilters
              searchLabel="Search orders"
              searchPlaceholder="Order ID, customer or waybill"
              selects={[
                {
                  param: "status",
                  label: "Status",
                  allLabel: "All statuses",
                  options: orderStatuses.map((s) => ({
                    value: s,
                    label: orderStatusLabels[s],
                  })),
                },
                {
                  param: "fulfilmentType",
                  label: "Fulfilment",
                  allLabel: "Any fulfilment",
                  options: fulfilmentTypes.map((f) => ({
                    value: f,
                    label: fulfilmentLabels[f],
                  })),
                },
              ]}
            />
          </Suspense>
          <Suspense fallback={<TableSkeleton />}>
            <OrdersResults searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}

async function OrdersResults({
  searchParams,
}: {
  searchParams: PageProps<"/orders">["searchParams"];
}) {
  const params = await searchParams;
  const query = orderQuerySchema.parse(flatParams(params));
  const page = unwrap(await getOrdersRepository().list(query));
  return <OrdersTable page={page} params={params} now={new Date()} />;
}
