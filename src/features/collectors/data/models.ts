import { z } from "zod";

import { pagedSchema } from "@/core/paged";
import { accountStatuses } from "@/features/customers/data/models";
import { vehicleTypes } from "@/features/dispatch/data/models";
import { pickupStatuses } from "@/features/pickups/data/pickup-status";

const vehicleSchema = z.object({
  type: z.enum(vehicleTypes),
  plate: z.string(),
  capacityKg: z.number().positive(),
});

export const collectorSummarySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  mobile: z.string(),
  status: z.enum(accountStatuses),
  online: z.boolean(),
  area: z.string(),
  hub: z.object({ id: z.string(), name: z.string() }),
  vehicle: vehicleSchema,
  rating: z.number().min(0).max(5),
  memberSince: z.iso.date(),
  collectedKgThisWeek: z.number().nonnegative(),
});
export type CollectorSummary = z.infer<typeof collectorSummarySchema>;

export const collectorPageSchema = pagedSchema(collectorSummarySchema);

export const collectorDetailSchema = collectorSummarySchema.extend({
  loadKg: z.number().nonnegative(),
  earnings: z.object({
    todayCents: z.number().int().nonnegative(),
    weekCents: z.number().int().nonnegative(),
    monthCents: z.number().int().nonnegative(),
  }),
  recentJobs: z.array(
    z.object({
      id: z.string(),
      status: z.enum(pickupStatuses),
      scheduledDate: z.iso.date(),
      area: z.string(),
      actualWeightKg: z.number().nonnegative().nullable(),
      collectorPayoutCents: z.number().int().nonnegative().nullable(),
    }),
  ),
});
export type CollectorDetail = z.infer<typeof collectorDetailSchema>;

export const collectorQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(accountStatuses).optional().catch(undefined),
  online: z.enum(["true", "false"]).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
});
export type CollectorQuery = z.infer<typeof collectorQuerySchema>;

/** Sri Lankan mobile, as typed: 077 123 4567 or +94 77 123 4567. Normalised to E.164. */
export const lkMobileSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .transform((value) =>
    value.startsWith("0") ? `+94${value.slice(1)}` : value,
  )
  .pipe(
    z
      .string()
      .regex(/^\+947\d{8}$/, "Enter a mobile number like 077 123 4567."),
  );

export const newCollectorInputSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name.").max(40),
  lastName: z.string().trim().min(1, "Enter a last name.").max(40),
  mobile: lkMobileSchema,
  area: z.string().trim().min(2, "Enter the collector's area.").max(60),
  hubId: z.string().min(1, "Choose a hub."),
  vehicle: z.object({
    type: z.enum(vehicleTypes, "Choose a vehicle."),
    plate: z
      .string()
      .trim()
      .toUpperCase()
      .min(4, "Enter the number plate.")
      .max(14),
    capacityKg: z
      .number()
      .int()
      .positive("Enter how many kg it can carry.")
      .max(5000),
  }),
});
export type NewCollectorInput = z.infer<typeof newCollectorInputSchema>;

export const hubSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  closesAt: z.string(),
});
export type Hub = z.infer<typeof hubSchema>;
export const hubListSchema = z.object({ items: z.array(hubSchema) });
