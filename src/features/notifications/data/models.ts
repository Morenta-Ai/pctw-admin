import { z } from "zod";

export const notificationTypes = [
  "pickupRequested",
  "pickupWaiting",
  "offerDeclined",
  "orderPlaced",
  "transferRequested",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum(notificationTypes),
  title: z.string(),
  body: z.string(),
  subjectId: z.string(),
  createdAt: z.iso.datetime(),
  read: z.boolean(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const notificationPageSchema = z.object({
  items: z.array(notificationSchema),
  nextCursor: z.string().nullable(),
  unreadCount: z.number().int().nonnegative(),
});
export type NotificationPage = z.infer<typeof notificationPageSchema>;

export type NotificationQuery = {
  unread?: boolean;
  limit?: number;
  cursor?: string;
};

/** Where a notification takes staff. */
export function notificationHref(
  n: Pick<Notification, "type" | "subjectId">,
): string {
  switch (n.type) {
    case "orderPlaced":
      return `/orders/${n.subjectId}`;
    case "transferRequested":
      return "/redemptions?type=cash&status=pending";
    default:
      return `/pickups/${n.subjectId}`;
  }
}

/** Fired on window when notifications are read, so the bell updates at once. */
export const NOTIFICATIONS_CHANGED = "rethread:notifications-changed";
