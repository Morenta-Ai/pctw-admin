import type {
  DonationProject,
  DonationProjectInput,
} from "@/features/donations/data/models";

/** Talks to `/admin/donation-projects`. Throws ApiError on failure. */
export type DonationsSource = {
  list(): Promise<DonationProject[]>;
  create(input: DonationProjectInput): Promise<DonationProject>;
  update(
    id: string,
    input: Partial<DonationProjectInput>,
  ): Promise<DonationProject>;
};
