import { z } from "zod";

import { pagedSchema } from "@/core/paged";
import { pickupStatuses } from "@/features/pickups/data/pickup-status";

export const accountStatuses = ["active", "suspended"] as const;
export type AccountStatus = (typeof accountStatuses)[number];

export const customerSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  mobile: z.string(),
  email: z.string().nullable(),
  area: z.string(),
  status: z.enum(accountStatuses),
  joinedAt: z.iso.datetime(),
  pickupCount: z.number().int().nonnegative(),
  collectedKg: z.number().nonnegative(),
  walletBalanceCents: z.number().int(),
});
export type CustomerSummary = z.infer<typeof customerSummarySchema>;

export const customerPageSchema = pagedSchema(customerSummarySchema);

export const customerDetailSchema = customerSummarySchema.extend({
  address: z.string(),
  familyMemberCount: z.number().int().nonnegative(),
  earnedCents: z.number().int().nonnegative(),
  recentPickups: z.array(
    z.object({
      id: z.string(),
      status: z.enum(pickupStatuses),
      scheduledDate: z.iso.date(),
      estimatedKg: z.number().nonnegative(),
      actualWeightKg: z.number().nonnegative().nullable(),
      customerPayoutCents: z.number().int().nonnegative().nullable(),
    }),
  ),
});
export type CustomerDetail = z.infer<typeof customerDetailSchema>;

export const customerQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(accountStatuses).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
});
export type CustomerQuery = z.infer<typeof customerQuerySchema>;

/** `POST /admin/{customers|collectors}/{id}/status`. */
export const statusChangeSchema = z
  .object({
    status: z.enum(accountStatuses),
    reason: z
      .string()
      .trim()
      .max(300, "Keep the reason under 300 characters.")
      .optional(),
  })
  .refine((v) => v.status === "active" || (v.reason?.length ?? 0) >= 3, {
    path: ["reason"],
    message: "Say why the account is suspended.",
  });
export type StatusChange = z.infer<typeof statusChangeSchema>;
