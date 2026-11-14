"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import {
  NOTIFICATIONS_CHANGED,
  notificationHref,
  notificationPageSchema,
  type NotificationPage,
} from "@/features/notifications/data/models";

const POLL_MS = 20_000;

/** The top bar's bell: unread count, the latest alerts, and a toast when one arrives. */
export function NotificationBell() {
  const [page, setPage] = useState<NotificationPage | null>(null);
  const [open, setOpen] = useState(false);
  // Set with each poll; never during render, which Cache Components prerenders.
  const [now, setNow] = useState<Date | null>(null);
  const [, startTransition] = useTransition();
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?limit=8", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const next = notificationPageSchema.parse(await response.json());
      // Toast only what arrived since the last poll, not the backlog on first load.
      if (seen.current) {
        for (const n of next.items) {
          if (!n.read && !seen.current.has(n.id)) {
            toast(n.title, {
              description: n.body,
              action: {
                label: "Open",
                onClick: () => window.location.assign(notificationHref(n)),
              },
            });
          }
        }
      }
      seen.current = new Set([
        ...(seen.current ?? []),
        ...next.items.map((n) => n.id),
      ]);
      setPage(next);
      setNow(new Date());
    } catch {
      // A missed poll is fine; the next one catches up.
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS);
    const onChanged = () => void load();
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged);
    };
  }, [load]);

  const unread = page?.unreadCount ?? 0;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-heading font-semibold">Notifications</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                startTransition(async () => {
                  await markAllNotificationsRead();
                  await load();
                })
              }
            >
              <CheckCheck />
              Mark all read
            </Button>
          )}
        </div>
        <div className="flex max-h-105 flex-col gap-0.5 overflow-y-auto p-2">
          {page?.items.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          )}
          {now &&
            page?.items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                now={now}
                onOpen={() => setOpen(false)}
              />
            ))}
        </div>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/notifications" onClick={() => setOpen(false)}>
              See all notifications
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
