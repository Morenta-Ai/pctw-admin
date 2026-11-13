import { z } from "zod";

const positiveCents = z.number().int().positive();

export const rateValuesSchema = z.object({
  customerRatePerKgCents: positiveCents,
  collectorRatePerKgCents: positiveCents,
  homeDeliveryChargeCents: positiveCents,
  clickAndCollectChargeCents: positiveCents,
});
export type RateValues = z.infer<typeof rateValuesSchema>;

export const rateSetSchema = rateValuesSchema.extend({
  id: z.string(),
  effectiveFrom: z.iso.date(),
  createdAt: z.iso.datetime(),
  createdBy: z.string(),
});
export type RateSet = z.infer<typeof rateSetSchema>;

/** `GET /admin/rates`. */
export const ratesSchema = z.object({
  current: rateSetSchema,
  scheduled: rateSetSchema.nullable(),
  history: z.array(rateSetSchema),
});
export type Rates = z.infer<typeof ratesSchema>;

/** `POST /admin/rates`. */
export const newRatesInputSchema = rateValuesSchema
  .extend({ effectiveFrom: z.iso.date() })
  .refine((r) => r.collectorRatePerKgCents <= r.customerRatePerKgCents, {
    path: ["collectorRatePerKgCents"],
    message: "The collector rate can't be more than the customer rate.",
  });
export type NewRatesInput = z.infer<typeof newRatesInputSchema>;

export const impactKeys = [
  "ghgSaved",
  "resourcesSaved",
  "landfillCostSaved",
  "forexSaved",
  "jobsGenerated",
  "entrepreneursCreated",
  "garmentsDonated",
  "donationValue",
] as const;
export type ImpactKey = (typeof impactKeys)[number];

export const impactUnits = [
  "kgCo2e",
  "kg",
  "lkrCents",
  "usdCents",
  "workDays",
  "microBusinesses",
  "garments",
] as const;
export type ImpactUnit = (typeof impactUnits)[number];

export const multiplierSchema = z.object({
  key: z.enum(impactKeys),
  unit: z.enum(impactUnits),
  perKg: z.number().nonnegative(),
});
export type Multiplier = z.infer<typeof multiplierSchema>;

/** `GET /admin/impact-multipliers`. */
export const multipliersSchema = z.object({
  items: z.array(multiplierSchema),
  updatedAt: z.iso.datetime(),
  updatedBy: z.string(),
});
export type Multipliers = z.infer<typeof multipliersSchema>;

/** `PUT /admin/impact-multipliers`. */
export const multipliersInputSchema = z.object({
  items: z.array(
    z.object({ key: z.enum(impactKeys), perKg: z.number().nonnegative() }),
  ),
});
export type MultipliersInput = z.infer<typeof multipliersInputSchema>;

export const isMoneyUnit = (unit: ImpactUnit) =>
  unit === "lkrCents" || unit === "usdCents";

/** How the portal names each metric, matching the user app's impact screen. */
export const impactLabels: Record<
  ImpactKey,
  { title: string; detail: string }
> = {
  ghgSaved: {
    title: "GHG saved",
    detail: "Greenhouse gas kept out of the air",
  },
  resourcesSaved: {
    title: "Resources saved",
    detail: "Raw materials saved for the next generation",
  },
  landfillCostSaved: {
    title: "Tax money saved",
    detail: "Local authority landfill costs avoided",
  },
  forexSaved: {
    title: "Forex saved",
    detail: "Foreign exchange the country doesn't spend",
  },
  jobsGenerated: {
    title: "Jobs generated",
    detail: "Sorting and tailoring work",
  },
  entrepreneursCreated: {
    title: "Entrepreneurs created",
    detail: "Micro-businesses supported",
  },
  garmentsDonated: {
    title: "Free clothes donated",
    detail: "Garments for people in need",
  },
  donationValue: {
    title: "Total donation value",
    detail: "Value of donated garments",
  },
};

export const unitLabels: Record<ImpactUnit, string> = {
  kgCo2e: "kg CO₂e",
  kg: "kg",
  lkrCents: "Rs.",
  usdCents: "USD",
  workDays: "work days",
  microBusinesses: "businesses",
  garments: "garments",
};
