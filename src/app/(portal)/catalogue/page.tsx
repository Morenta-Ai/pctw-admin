import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";

export const metadata: Metadata = { title: "Catalogue" };

export default async function CataloguePage() {
  await requireRole("admin");

  return (
    <>
      <PageHeader
        title="Catalogue"
        description="Rejuvenated garments for sale in the customer app."
      />
      <ComingSoon step={9}>
        Create, edit, publish and unpublish products, with photos, sizes, prices
        and stock.
      </ComingSoon>
    </>
  );
}
