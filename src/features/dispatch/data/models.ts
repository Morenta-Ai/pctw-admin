import { z } from "zod";

import {
  pickupSources,
  pickupStatuses,
} from "@/features/pickups/data/pickup-status";

export const vehicleTypes = [
  "threeWheeler",
  "motorbike",
  "van",
  "lorry",
] as const;

export const vehicleLabels: Record<(typeof vehicleTypes)[number], string> = {
  threeWheeler: "Three-wheeler",
  motorbike: "Motorbike",
  van: "Van",
  lorry: "Lorry",
};

export const dispatchCollectorSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  mobile: z.string(),
  online: z.boolean(),
  latitude: z.number(),
  longitude: z.number(),
  lastSeenAt: z.iso.datetime(),
  area: z.string(),
  vehicle: z.object({
    type: z.enum(vehicleTypes),
    plate: z.string(),
    capacityKg: z.number().positive(),
  }),
  loadKg: z.number().nonnegative(),
  activePickupId: z.string().nullable(),
});
export type DispatchCollector = z.infer<typeof dispatchCollectorSchema>;

export const dispatchPickupSchema = z.object({
  id: z.string(),
  status: z.enum(pickupStatuses),
  source: z.enum(pickupSources),
  customerName: z.string(),
  area: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  estimatedKg: z.number().nonnegative(),
  windowStart: z.iso.datetime(),
  windowEnd: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  collectorId: z.string().nullable(),
  offer: z
    .object({
      assignmentId: z.string(),
      collectorId: z.string(),
      collectorName: z.string(),
      expiresAt: z.iso.datetime(),
    })
    .nullable(),
});
export type DispatchPickup = z.infer<typeof dispatchPickupSchema>;

export const dispatchHubSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});
export type DispatchHub = z.infer<typeof dispatchHubSchema>;

/** `GET /admin/dispatch`. */
export const dispatchSchema = z.object({
  generatedAt: z.iso.datetime(),
  collectors: z.array(dispatchCollectorSchema),
  pickups: z.array(dispatchPickupSchema),
  hubs: z.array(dispatchHubSchema),
});
export type Dispatch = z.infer<typeof dispatchSchema>;
