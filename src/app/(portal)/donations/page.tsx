import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";

export const metadata: Metadata = { title: "Donations" };

export default async function DonationsPage() {
  await requireRole("admin");

  return (
    <>
      <PageHeader
        title="Donations"
        description="Social activity campaigns customers can donate their earnings to."
      />
      <ComingSoon step={11}>
        Create and manage donation campaigns, with goals, amounts raised and
        dates.
      </ComingSoon>
    </>
  );
}
