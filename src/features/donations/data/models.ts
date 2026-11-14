import { z } from "zod";

export const MIN_GOAL_CENTS = 100_000;

export const donationProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  goalCents: z.number().int().positive(),
  raisedCents: z.number().int().nonnegative(),
  donorCount: z.number().int().nonnegative(),
  active: z.boolean(),
  endsOn: z.iso.date().nullable(),
  createdAt: z.iso.datetime(),
});
export type DonationProject = z.infer<typeof donationProjectSchema>;

export const donationProjectListSchema = z.object({
  items: z.array(donationProjectSchema),
});

export const donationProjectInputSchema = z.object({
  name: z.string().trim().min(3, "Give the project a name.").max(80),
  summary: z
    .string()
    .trim()
    .min(3, "Add a short summary, like “Education · 420 children”.")
    .max(80, "Keep the summary under 80 characters."),
  goalCents: z
    .number()
    .int()
    .min(MIN_GOAL_CENTS, "The goal must be at least Rs. 1,000."),
  active: z.boolean(),
  endsOn: z.iso.date().nullable(),
});
export type DonationProjectInput = z.infer<typeof donationProjectInputSchema>;
