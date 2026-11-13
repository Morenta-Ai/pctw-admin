import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/core/auth/session";
import { ProductForm } from "@/features/catalogue/components/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireRole("admin");
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
        title="New product"
        description="Add a rejuvenated garment to the shop. It appears in the customer app as soon as it's saved and shown."
      />
      <Card>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
    </>
  );
}
