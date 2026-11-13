import {
  Ban,
  PackageCheck,
  PackagePlus,
  ShoppingBag,
  UserCheck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { formatRelative } from "@/core/format/format";
import type { Activity } from "@/features/dashboard/data/models";
import { cn } from "@/lib/utils";

const display: Record<
  Activity["type"],
  { icon: LucideIcon; title: string; className: string }
> = {
  pickupRequested: {
    icon: PackagePlus,
    title: "New pickup",
    className: "bg-warning-bg text-warning",
  },
  pickupAssigned: {
    icon: UserCheck,
    title: "Collector assigned",
    className: "bg-info-bg text-info",
  },
  pickupCollected: {
    icon: PackageCheck,
    title: "Collected",
    className: "bg-lime-tint text-primary",
  },
  pickupDelivered: {
    icon: Warehouse,
    title: "Delivered to hub",
    className: "bg-success-bg text-success",
  },
  pickupCancelled: {
    icon: Ban,
    title: "Cancelled",
    className: "bg-danger-bg text-destructive",
  },
  orderPlaced: {
    icon: ShoppingBag,
    title: "New order",
    className: "bg-secondary text-primary",
  },
};

export function ActivityFeed({
  activity,
  now,
}: {
  activity: Activity[];
  now: Date;
}) {
  if (activity.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nothing has happened yet today.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {activity.map((event) => {
        const { icon: Icon, title, className } = display[event.type];
        const href =
          event.type === "orderPlaced"
            ? `/orders/${event.subjectId}`
            : `/pickups/${event.subjectId}`;
        return (
          <li key={event.id}>
            <Link
              href={href}
              className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  className,
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold">
                  {title}{" "}
                  <span className="font-mono text-xs font-medium text-muted-foreground">
                    {event.subjectId}
                  </span>
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {event.summary}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelative(event.occurredAt, now)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
