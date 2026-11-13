import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  await requireRole("admin");

  return (
    <>
      <PageHeader
        title="Staff"
        description="Admin and call-centre accounts for this portal."
      />
      <ComingSoon step={10}>
        Invite staff, change roles and suspend accounts.
      </ComingSoon>
    </>
  );
}
