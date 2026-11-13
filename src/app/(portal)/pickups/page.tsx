import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { TableSkeleton } from "@/components/app/table-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/core/auth/session";
import { unwrap } from "@/core/result";
import { PickupFilters } from "@/features/pickups/components/pickup-filters";
import { PickupsTable } from "@/features/pickups/components/pickups-table";
import { getPickupsRepository } from "@/features/pickups/data/pickups-repository";
import { pickupQueryFromParams } from "@/features/pickups/pickup-query";

export const metadata: Metadata = { title: "Pickups" };

export default async function PickupsPage({
  searchParams,
}: PageProps<"/pickups">) {
  await requireRole();

  return (
    <>
      <PageHeader
        title="Pickups"
        description="Every pickup request, from booking to delivery at the hub. Filter by status, date or how it was booked."
      />
      <Card>
        <CardContent>
          <Suspense fallback={<Skeleton className="mb-4 h-9" />}>
            <PickupFilters />
          </Suspense>
          <Suspense fallback={<TableSkeleton />}>
            <PickupsResults searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}

async function PickupsResults({
  searchParams,
}: {
  searchParams: PageProps<"/pickups">["searchParams"];
}) {
  const params = await searchParams;
  const now = new Date();
  const query = pickupQueryFromParams(params, now);
  const page = unwrap(await getPickupsRepository().list(query));

  return (
    <PickupsTable
      page={page}
      params={params}
      sort={query.sort ?? "-createdAt"}
      now={now}
    />
  );
}
