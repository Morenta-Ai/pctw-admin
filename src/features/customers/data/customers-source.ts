import type { Paged } from "@/core/paged";
import type {
  CustomerDetail,
  CustomerQuery,
  CustomerSummary,
  StatusChange,
} from "@/features/customers/data/models";

/** Talks to `/admin/customers`. Throws ApiError on failure. */
export type CustomersSource = {
  list(query: CustomerQuery): Promise<Paged<CustomerSummary>>;
  get(id: string): Promise<CustomerDetail>;
  setStatus(id: string, change: StatusChange): Promise<CustomerDetail>;
};
