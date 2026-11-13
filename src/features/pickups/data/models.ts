import { z } from "zod";

import { pagedSchema } from "@/core/paged";
import {
  pickupSources,
  pickupStatuses,
} from "@/features/pickups/data/pickup-status";

const kg = z.number().nonnegative();
const cents = z.number().int().nonnegative();

export const slotSchema = z.enum(["morning", "afternoon", "evening"]);
export const methodSchema = z.enum(["bulk", "itemised"]);

/** A row in `GET /admin/pickups`. */
export const pickupSummarySchema = z.object({
  id: z.string(),
  status: z.enum(pickupStatuses),
  source: z.enum(pickupSources),
  method: methodSchema,
  customerName: z.string(),
  area: z.string(),
  scheduledDate: z.iso.date(),
  slot: slotSchema,
  windowStart: z.iso.datetime(),
  windowEnd: z.iso.datetime(),
  estimatedKg: kg,
  actualWeightKg: kg.nullable(),
  collector: z
    .object({ id: z.string(), code: z.string(), name: z.string() })
    .nullable(),
  createdAt: z.iso.datetime(),
});
export type PickupSummary = z.infer<typeof pickupSummarySchema>;

export const pickupPageSchema = pagedSchema(pickupSummarySchema);

export const pickupEventSchema = z.object({
  status: z.enum(pickupStatuses),
  occurredAt: z.iso.datetime(),
  actor: z.string().nullable(),
});
export type PickupEvent = z.infer<typeof pickupEventSchema>;

/** `GET /admin/pickups/{id}`. */
export const pickupDetailSchema = z.object({
  id: z.string(),
  status: z.enum(pickupStatuses),
  source: z.enum(pickupSources),
  method: methodSchema,
  customer: z.object({ id: z.string(), name: z.string(), mobile: z.string() }),
  area: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  scheduledDate: z.iso.date(),
  slot: slotSchema,
  windowStart: z.iso.datetime(),
  windowEnd: z.iso.datetime(),
  estimatedKg: kg,
  itemCount: z.number().int().nonnegative().nullable(),
  bagCount: z.number().int().nonnegative(),
  actualWeightKg: kg.nullable(),
  note: z.string().nullable(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().int().positive().nullable(),
      size: z.string().nullable(),
      condition: z.enum(["good", "fair", "worn"]),
    }),
  ),
  collector: z
    .object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      mobile: z.string(),
      vehiclePlate: z.string(),
    })
    .nullable(),
  customerRatePerKgCents: cents,
  collectorRatePerKgCents: cents,
  customerPayoutCents: cents.nullable(),
  collectorPayoutCents: cents.nullable(),
  hub: z.object({ id: z.string(), name: z.string() }).nullable(),
  cancelReason: z.string().nullable(),
  createdAt: z.iso.datetime(),
  timeline: z.array(pickupEventSchema),
});
export type PickupDetail = z.infer<typeof pickupDetailSchema>;

export const pickupSorts = [
  "createdAt",
  "-createdAt",
  "scheduledDate",
  "-scheduledDate",
  "estimatedKg",
  "-estimatedKg",
] as const;
export type PickupSort = (typeof pickupSorts)[number];

/** The list's query, parsed from the page's URL. */
export const pickupQuerySchema = z.object({
  status: z.enum(pickupStatuses).optional().catch(undefined),
  source: z.enum(pickupSources).optional().catch(undefined),
  date: z.iso.date().optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
  sort: z.enum(pickupSorts).optional().catch(undefined),
});
export type PickupQuery = z.infer<typeof pickupQuerySchema>;

export const cancelPickupInputSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Say why the pickup is cancelled.")
    .max(300, "Keep the reason under 300 characters."),
});
