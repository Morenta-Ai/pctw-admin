import type { Paged } from "@/core/paged";
import type {
  Redemption,
  RedemptionQuery,
} from "@/features/redemptions/data/models";

/** Talks to `/admin/redemptions`. Throws ApiError on failure. */
export type RedemptionsSource = {
  list(query: RedemptionQuery): Promise<Paged<Redemption>>;
  pay(id: string, reference: string): Promise<Redemption>;
  reject(id: string, reason: string): Promise<Redemption>;
};
