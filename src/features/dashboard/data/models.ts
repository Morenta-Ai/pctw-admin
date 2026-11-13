import { z } from "zod";

export const pickupStatuses = [
  "pending",
  "assigned",
  "enRoute",
  "arrived",
  "collected",
  "deliveredToHub",
  "cancelled",
] as const;

export const activityTypes = [
  "pickupRequested",
  "pickupAssigned",
  "pickupCollected",
  "pickupDelivered",
  "pickupCancelled",
  "orderPlaced",
] as const;

export const activitySchema = z.object({
  id: z.string(),
  type: z.enum(activityTypes),
  subjectId: z.string(),
  summary: z.string(),
  occurredAt: z.iso.datetime(),
});
export type Activity = z.infer<typeof activitySchema>;

export const dailyCollectionSchema = z.object({
  date: z.iso.date(),
  pickups: z.number().int().nonnegative(),
  collectedKg: z.number().nonnegative(),
});
export type DailyCollection = z.infer<typeof dailyCollectionSchema>;

const count = z.number().int().nonnegative();

/** `GET /admin/dashboard`. */
export const dashboardSchema = z.object({
  date: z.iso.date(),
  pickupsToday: z.object({
    total: count,
    pending: count,
    assigned: count,
    enRoute: count,
    arrived: count,
    collected: count,
    deliveredToHub: count,
    cancelled: count,
  }),
  unassignedOverdue: z.number().int().nonnegative(),
  collectedTodayKg: z.number().nonnegative(),
  customerPayoutsTodayCents: z.number().int().nonnegative(),
  collectorPayoutsTodayCents: z.number().int().nonnegative(),
  collectors: z.object({
    online: z.number().int().nonnegative(),
    active: z.number().int().nonnegative(),
  }),
  orders: z.object({
    open: z.number().int().nonnegative(),
    placedToday: z.number().int().nonnegative(),
  }),
  daily: z.array(dailyCollectionSchema),
  recentActivity: z.array(activitySchema),
});
export type Dashboard = z.infer<typeof dashboardSchema>;
