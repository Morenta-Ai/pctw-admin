import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/app/status-pill";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/core/auth/session";
import { formatDateTime } from "@/core/format/format";
import { ProductForm } from "@/features/catalogue/components/product-form";
import { getCatalogueRepository } from "@/features/catalogue/data/catalogue-repository";
import {
  productStatus,
  productStatusLabels,
} from "@/features/catalogue/data/models";

export async function generateMetadata({
  params,
}: PageProps<"/catalogue/[id]">): Promise<Metadata> {
  return { title: `Edit ${(await params).id}` };
}

export default async function EditProductPage({
  params,
}: PageProps<"/catalogue/[id]">) {
  await requireRole("admin");
  const { id } = await params;
  const result = await getCatalogueRepository().get(decodeURIComponent(id));
  if (!result.ok) {
    if (result.error.isNotFound) notFound();
    throw result.error;
  }
  const product = result.data;
  const status = productStatus(product);

  return (
    <>
      <Link
        href="/catalogue"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Catalogue
      </Link>
      <PageHeader
        title={product.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusPill
              tone={
                status === "published"
                  ? "success"
                  : status === "hidden"
                    ? "neutral"
                    : "warning"
              }
            >
              {productStatusLabels[status]}
            </StatusPill>
            <span className="font-mono">{product.id}</span>· added{" "}
            {formatDateTime(product.createdAt)} · last changed{" "}
            {formatDateTime(product.updatedAt)}
          </span>
        }
      />
      <Card>
        <CardContent>
          <ProductForm key={product.updatedAt} product={product} />
        </CardContent>
      </Card>
    </>
  );
}
