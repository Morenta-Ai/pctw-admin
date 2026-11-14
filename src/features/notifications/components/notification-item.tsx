"use client";

import {
  Clock,
  PackagePlus,
  ShoppingBag,
  UserX,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { formatRelative } from "@/core/format/format";
import { markNotificationRead } from "@/features/notifications/actions";
import {
  NOTIFICATIONS_CHANGED,
  notificationHref,
  type Notification,
  type NotificationType,
} from "@/features/notifications/data/models";
import { cn } from "@/lib/utils";

const look: Record<NotificationType, { icon: LucideIcon; className: string }> =
  {
    pickupRequested: {
      icon: PackagePlus,
      className: "bg-secondary text-primary",
    },
    pickupWaiting: { icon: Clock, className: "bg-danger-bg text-destructive" },
    offerDeclined: { icon: UserX, className: "bg-warning-bg text-warning" },
    orderPlaced: { icon: ShoppingBag, className: "bg-lime-tint text-primary" },
    transferRequested: { icon: Wallet, className: "bg-info-bg text-info" },
  };

/** One notification; opening it marks it read. */
export function NotificationItem({
  notification: n,
  now,
  onOpen,
}: {
  notification: Notification;
  now: Date;
  onOpen?: () => void;
}) {
  const router = useRouter();
  const { icon: Icon, className } = look[n.type];

  return (
    <button
      type="button"
      onClick={() => {
        onOpen?.();
        if (!n.read) {
          void markNotificationRead(n.id).then(() =>
            window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED)),
          );
        }
        router.push(notificationHref(n));
      }}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover:bg-muted",
        !n.read && "bg-secondary/50",
      )}
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
        <span
          className={cn("text-sm", n.read ? "font-medium" : "font-semibold")}
        >
          {n.title}
        </span>
        <span className="text-xs text-muted-foreground">{n.body}</span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">
          {formatRelative(n.createdAt, now)}
        </span>
      </span>
      {!n.read && (
        <span
          aria-label="Unread"
          className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive"
        />
      )}
    </button>
  );
}
