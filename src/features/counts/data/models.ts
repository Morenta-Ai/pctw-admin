import { z } from "zod";

/** `GET /admin/counts`: the sidebar's badges. */
export const countsSchema = z.object({
  newOrders: z.number().int().nonnegative(),
  waitingPickups: z.number().int().nonnegative(),
  pendingTransfers: z.number().int().nonnegative(),
  unreadNotifications: z.number().int().nonnegative(),
});
export type Counts = z.infer<typeof countsSchema>;
