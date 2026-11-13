import type { MockMultiplier, MockRateSet } from "@/mock/types";

/** Rate history, oldest first. The last is in force today. */
export const seedRateSets = (): MockRateSet[] => [
  {
    id: "rate_1",
    customerRatePerKgCents: 10_000,
    collectorRatePerKgCents: 3_500,
    homeDeliveryChargeCents: 30_000,
    clickAndCollectChargeCents: 20_000,
    effectiveFrom: "2025-03-01",
    createdAt: "2025-02-20T04:00:00.000Z",
    createdBy: "Nadeesha Perera",
  },
  {
    id: "rate_2",
    customerRatePerKgCents: 11_000,
    collectorRatePerKgCents: 3_800,
    homeDeliveryChargeCents: 35_000,
    clickAndCollectChargeCents: 25_000,
    effectiveFrom: "2025-11-01",
    createdAt: "2025-10-18T05:30:00.000Z",
    createdBy: "Nadeesha Perera",
  },
  {
    id: "rate_3",
    customerRatePerKgCents: 12_000,
    collectorRatePerKgCents: 4_000,
    homeDeliveryChargeCents: 35_000,
    clickAndCollectChargeCents: 25_000,
    effectiveFrom: "2026-10-01",
    createdAt: "2026-09-24T08:15:00.000Z",
    createdBy: "Nadeesha Perera",
  },
];

/** Factors behind the user app's sample impact figures (52.6 kg → 184 kg CO₂e …). */
export const seedMultipliers = (): MockMultiplier[] => [
  { key: "ghgSaved", unit: "kgCo2e", perKg: 3.5 },
  { key: "resourcesSaved", unit: "kg", perKg: 7 },
  { key: "landfillCostSaved", unit: "lkrCents", perKg: 2_500 },
  { key: "forexSaved", unit: "usdCents", perKg: 80 },
  { key: "jobsGenerated", unit: "workDays", perKg: 0.27 },
  { key: "entrepreneursCreated", unit: "microBusinesses", perKg: 0.02 },
  { key: "garmentsDonated", unit: "garments", perKg: 0.72 },
  { key: "donationValue", unit: "lkrCents", perKg: 2_400 },
];
