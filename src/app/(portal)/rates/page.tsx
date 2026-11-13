import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";

export const metadata: Metadata = { title: "Rates & impact" };

export default async function RatesPage() {
  await requireRole("admin");

  return (
    <>
      <PageHeader
        title="Rates & impact"
        description="The price per kg, collector payouts and the impact multipliers the apps show."
      />
      <ComingSoon step={8}>
        Price per kg, collector payout per kg and the click & collect transport
        charge, with history, plus the impact multipliers.
      </ComingSoon>
    </>
  );
}
