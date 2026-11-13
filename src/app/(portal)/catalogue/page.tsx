import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ListFilters } from "@/components/app/list-filters";
import { PageHeader } from "@/components/app/page-header";
import { TableSkeleton } from "@/components/app/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/core/auth/session";
import { unwrap } from "@/core/result";
import { flatParams } from "@/core/search-params";
import { colomboDateKey } from "@/core/time";
import { ProductsTable } from "@/features/catalogue/components/products-table";
import { getCatalogueRepository } from "@/features/catalogue/data/catalogue-repository";
import {
  categoryLabels,
  productCategories,
  productQuerySchema,
  productStatuses,
  productStatusLabels,
} from "@/features/catalogue/data/models";

export const metadata: Metadata = { title: "Catalogue" };

export default async function CataloguePage({
  searchParams,
}: PageProps<"/catalogue">) {
  await requireRole("admin");

  return (
    <>
      <PageHeader
        title="Catalogue"
        description="Rejuvenated garments for the customer app's shop. Add each day's garments, and hide anything that shouldn't be on sale."
        actions={
          <Button asChild>
            <Link href="/catalogue/new">
              <Plus />
              New product
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <Suspense fallback={<Skeleton className="mb-4 h-9" />}>
            <ListFilters
              searchLabel="Search products"
              searchPlaceholder="Name or story"
              selects={[
                {
                  param: "category",
                  label: "Category",
                  allLabel: "All categories",
                  options: productCategories.map((c) => ({
                    value: c,
                    label: categoryLabels[c],
                  })),
                },
                {
                  param: "status",
                  label: "Status",
                  allLabel: "Any status",
                  options: productStatuses.map((s) => ({
                    value: s,
                    label: productStatusLabels[s],
                  })),
                },
                {
                  param: "uploaded",
                  label: "Added",
                  allLabel: "Added any day",
                  options: [{ value: "today", label: "Added today" }],
                },
              ]}
            />
          </Suspense>
          <Suspense fallback={<TableSkeleton />}>
            <ProductsResults searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}

async function ProductsResults({
  searchParams,
}: {
  searchParams: PageProps<"/catalogue">["searchParams"];
}) {
  const params = await searchParams;
  const now = new Date();
  const flat = flatParams(params);
  const query = productQuerySchema.parse({
    ...flat,
    uploadedOn: flat.uploaded === "today" ? colomboDateKey(now) : undefined,
  });
  const page = unwrap(await getCatalogueRepository().list(query));
  return <ProductsTable page={page} params={params} now={now} />;
}
