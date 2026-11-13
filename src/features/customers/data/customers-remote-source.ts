import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import type { CustomersSource } from "@/features/customers/data/customers-source";
import {
  customerDetailSchema,
  customerPageSchema,
  type CustomerQuery,
  type StatusChange,
} from "@/features/customers/data/models";

export class CustomersRemoteSource implements CustomersSource {
  constructor(private readonly api: ApiClient) {}

  list(query: CustomerQuery) {
    return this.api.get("/admin/customers", {
      query: { ...query, pageSize: 25 },
      schema: customerPageSchema,
    });
  }

  get(id: string) {
    return this.api.get(`/admin/customers/${encodeURIComponent(id)}`, {
      schema: customerDetailSchema,
    });
  }

  setStatus(id: string, change: StatusChange) {
    return this.api.post(`/admin/customers/${encodeURIComponent(id)}/status`, {
      body: change,
      schema: customerDetailSchema,
    });
  }
}
