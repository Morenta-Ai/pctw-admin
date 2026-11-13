import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";

export const metadata: Metadata = { title: "Redemptions" };

export default async function RedemptionsPage() {
  await requireRole();

  return (
    <>
      <PageHeader
        title="Redemptions"
        description="Cash transfers and vouchers customers asked for from their wallet."
      />
      <ComingSoon step={11}>
        A queue of cash transfers to approve, mark paid or reject, and the
        vouchers issued.
      </ComingSoon>
    </>
  );
}
