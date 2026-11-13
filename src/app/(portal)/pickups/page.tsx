import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";

export const metadata: Metadata = { title: "Pickups" };

export default async function PickupsPage() {
  await requireRole();

  return (
    <>
      <PageHeader
        title="Pickups"
        description="Every pickup request, from booking to delivery at the hub."
      />
      <ComingSoon step={4}>
        A searchable table of pickup requests with status, area and date
        filters, and a detail page for each.
      </ComingSoon>
    </>
  );
}
