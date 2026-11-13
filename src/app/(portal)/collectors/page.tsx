import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";

export const metadata: Metadata = { title: "Collectors" };

export default async function CollectorsPage() {
  await requireRole();

  return (
    <>
      <PageHeader
        title="Collectors"
        description="Field collectors, their status, load and earnings."
      />
      <ComingSoon step={10}>
        Collector accounts with jobs, earnings, hub and load; create a collector
        and issue a COL- code.
      </ComingSoon>
    </>
  );
}
