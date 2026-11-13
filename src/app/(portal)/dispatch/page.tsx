import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";

export const metadata: Metadata = { title: "Live map" };

export default async function DispatchPage() {
  await requireRole();

  return (
    <>
      <PageHeader
        title="Live map"
        description="Online collectors and pending pickup requests, live."
      />
      <ComingSoon step={5}>
        A live map of online collectors and pending requests, refreshed every 10
        seconds.
      </ComingSoon>
    </>
  );
}
