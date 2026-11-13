import type { Paged } from "@/core/paged";
import type {
  PickupDetail,
  PickupQuery,
  PickupSummary,
} from "@/features/pickups/data/models";

/** Talks to `/admin/pickups`. Throws ApiError on failure. */
export type PickupsSource = {
  list(query: PickupQuery): Promise<Paged<PickupSummary>>;
  get(id: string): Promise<PickupDetail>;
  cancel(id: string, reason: string): Promise<PickupDetail>;
};
