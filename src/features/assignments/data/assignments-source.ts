import type {
  Assignment,
  OfferInput,
} from "@/features/assignments/data/models";

/** Talks to the assignment endpoints. Throws ApiError on failure. */
export type AssignmentsSource = {
  offer(pickupId: string, input: OfferInput): Promise<Assignment>;
  listForPickup(pickupId: string): Promise<Assignment[]>;
  get(id: string): Promise<Assignment>;
  withdraw(id: string): Promise<Assignment>;
};
