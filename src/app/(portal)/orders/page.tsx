import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  await requireRole();

  return (
    <>
      <PageHeader
        title="Orders"
        description="Marketplace orders: packing, waybills and delivery or click & collect."
      />
      <ComingSoon step={7}>
        Marketplace orders with new-order alerts, status updates and printable
        waybills.
      </ComingSoon>
    </>
  );
}
