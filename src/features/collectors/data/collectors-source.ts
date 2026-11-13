import type { Paged } from "@/core/paged";
import type {
  CollectorDetail,
  CollectorQuery,
  CollectorSummary,
  Hub,
  NewCollectorInput,
} from "@/features/collectors/data/models";
import type { StatusChange } from "@/features/customers/data/models";

/** Talks to `/admin/collectors` and `/admin/hubs`. Throws ApiError on failure. */
export type CollectorsSource = {
  list(query: CollectorQuery): Promise<Paged<CollectorSummary>>;
  get(id: string): Promise<CollectorDetail>;
  create(input: NewCollectorInput): Promise<CollectorDetail>;
  setStatus(id: string, change: StatusChange): Promise<CollectorDetail>;
  listHubs(): Promise<Hub[]>;
};
