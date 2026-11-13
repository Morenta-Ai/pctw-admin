import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requireRole();

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Alerts for new pickups, unassigned requests, new orders and declined assignments."
      />
      <ComingSoon step={12}>
        The alerts centre, with the bell&apos;s unread count and mark-as-read.
      </ComingSoon>
    </>
  );
}
