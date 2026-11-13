import { z } from "zod";

export const assignmentStatuses = [
  "offered",
  "accepted",
  "declined",
  "expired",
  "withdrawn",
] as const;
export type AssignmentStatus = (typeof assignmentStatuses)[number];

/** How long a collector has to answer an offer. */
export const OFFER_SECONDS = 45;

export const assignmentSchema = z.object({
  id: z.string(),
  pickupId: z.string(),
  collector: z.object({ id: z.string(), code: z.string(), name: z.string() }),
  status: z.enum(assignmentStatuses),
  note: z.string().nullable(),
  offeredAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  respondedAt: z.iso.datetime().nullable(),
  declineReason: z.string().nullable(),
  offeredBy: z.string(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const assignmentListSchema = z.object({
  items: z.array(assignmentSchema),
});

export const offerInputSchema = z.object({
  collectorId: z.string().min(1, "Choose a collector."),
  note: z
    .string()
    .trim()
    .max(200, "Keep the note under 200 characters.")
    .transform((note) => (note === "" ? undefined : note))
    .optional(),
});
export type OfferInput = z.infer<typeof offerInputSchema>;
