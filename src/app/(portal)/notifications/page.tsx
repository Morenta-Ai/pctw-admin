import { BellOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { TableSkeleton } from "@/components/app/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/core/auth/session";
import { unwrap } from "@/core/result";
import { firstParam } from "@/core/search-params";
import { hrefWith } from "@/core/url";
import { MarkAllReadButton } from "@/features/notifications/components/mark-all-read-button";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import { getNotificationsRepository } from "@/features/notifications/data/notifications-repository";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage({
  searchParams,
}: PageProps<"/notifications">) {
  await requireRole();
  return (
    <>
      <PageHeader
        title="Notifications"
        description="New pickups and orders, pickups no collector has taken, declined offers and bank transfers to make."
        actions={<MarkAllReadButton />}
      />
      <Card>
        <CardContent>
          <Suspense fallback={<TableSkeleton rows={6} />}>
            <NotificationList searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}

async function NotificationList({
  searchParams,
}: {
  searchParams: PageProps<"/notifications">["searchParams"];
}) {
  const params = await searchParams;
  const unread = firstParam(params.show) === "unread";
  const cursor = firstParam(params.cursor);
  const page = unwrap(
    await getNotificationsRepository().list({ unread, limit: 25, cursor }),
  );
  const now = new Date();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1" role="tablist" aria-label="Show">
        {[
          ["all", "All"],
          ["unread", `Unread (${page.unreadCount})`],
        ].map(([value, label]) => {
          const active = (value === "unread") === unread;
          return (
            <Button
              key={value}
              asChild
              size="sm"
              variant={active ? "secondary" : "ghost"}
              className={cn(active && "font-semibold")}
            >
              <Link
                role="tab"
                aria-selected={active}
                href={hrefWith(
                  "/notifications",
                  {},
                  { show: value === "unread" ? "unread" : null },
                )}
              >
                {label}
              </Link>
            </Button>
          );
        })}
      </div>
      {page.items.length === 0 ? (
        <EmptyState icon={BellOff} title="You're all caught up">
          {unread
            ? "No unread notifications."
            : "Nothing in the last two days."}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-0.5">
          {page.items.map((n) => (
            <NotificationItem key={n.id} notification={n} now={now} />
          ))}
        </div>
      )}
      {page.nextCursor && (
        <Button variant="outline" className="w-fit self-center" asChild>
          <Link
            href={hrefWith("/notifications", params, {
              cursor: page.nextCursor,
            })}
          >
            Older
          </Link>
        </Button>
      )}
    </div>
  );
}
