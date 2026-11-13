import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  await requireRole();

  return (
    <>
      <PageHeader
        title="Customers"
        description="People who book pickups in the ReThread app."
      />
      <ComingSoon step={10}>
        Customer accounts with their pickups, wallet balance and family
        profiles, and suspend or reactivate.
      </ComingSoon>
    </>
  );
}
