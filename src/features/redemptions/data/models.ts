import { z } from "zod";

import type { PillTone } from "@/components/app/status-pill";
import { pagedSchema } from "@/core/paged";

export const redemptionTypes = ["cash", "voucher", "donation"] as const;
export type RedemptionType = (typeof redemptionTypes)[number];

export const redemptionStatuses = [
  "pending",
  "paid",
  "rejected",
  "completed",
] as const;
export type RedemptionStatus = (typeof redemptionStatuses)[number];

export const redemptionTypeLabels: Record<RedemptionType, string> = {
  cash: "Bank transfer",
  voucher: "Voucher",
  donation: "Donation",
};

export const redemptionStatusLabels: Record<
  RedemptionStatus,
  [string, PillTone]
> = {
  pending: ["To pay", "warning"],
  paid: ["Paid", "success"],
  rejected: ["Rejected", "danger"],
  completed: ["Completed", "neutral"],
};

export const redemptionSchema = z.object({
  id: z.string(),
  type: z.enum(redemptionTypes),
  status: z.enum(redemptionStatuses),
  amountCents: z.number().int().positive(),
  customer: z.object({ id: z.string(), name: z.string(), mobile: z.string() }),
  bank: z
    .object({
      bankName: z.string(),
      branch: z.string(),
      accountName: z.string(),
      accountNumber: z.string(),
    })
    .nullable(),
  voucher: z.object({ brandName: z.string(), code: z.string() }).nullable(),
  donation: z
    .object({ projectId: z.string(), projectName: z.string() })
    .nullable(),
  requestedAt: z.iso.datetime(),
  processedAt: z.iso.datetime().nullable(),
  processedBy: z.string().nullable(),
  reference: z.string().nullable(),
  rejectReason: z.string().nullable(),
});
export type Redemption = z.infer<typeof redemptionSchema>;

export const redemptionPageSchema = pagedSchema(redemptionSchema);

export const redemptionQuerySchema = z.object({
  type: z.enum(redemptionTypes).optional().catch(undefined),
  status: z.enum(redemptionStatuses).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
});
export type RedemptionQuery = z.infer<typeof redemptionQuerySchema>;

export const payInputSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(4, "Enter the bank's transfer reference.")
    .max(40, "Keep the reference under 40 characters."),
});
export const rejectInputSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Say why, so the customer knows what to fix.")
    .max(300, "Keep the reason under 300 characters."),
});
