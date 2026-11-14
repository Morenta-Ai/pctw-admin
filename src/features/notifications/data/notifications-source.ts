import type {
  NotificationPage,
  NotificationQuery,
} from "@/features/notifications/data/models";

/** Talks to `/admin/notifications`. Throws ApiError on failure. */
export type NotificationsSource = {
  list(query: NotificationQuery): Promise<NotificationPage>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
};
