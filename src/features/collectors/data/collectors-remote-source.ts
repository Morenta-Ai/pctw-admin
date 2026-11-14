import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import type { CollectorsSource } from "@/features/collectors/data/collectors-source";
import {
  collectorDetailSchema,
  collectorPageSchema,
  hubListSchema,
  type CollectorQuery,
  type NewCollectorInput,
} from "@/features/collectors/data/models";
import type { StatusChange } from "@/features/customers/data/models";

const enc = encodeURIComponent;

export class CollectorsRemoteSource implements CollectorsSource {
  constructor(private readonly api: ApiClient) {}

  list(query: CollectorQuery) {
    return this.api.get("/admin/collectors", {
      query: { ...query, pageSize: 25 },
      schema: collectorPageSchema,
    });
  }

  get(id: string) {
    return this.api.get(`/admin/collectors/${enc(id)}`, {
      schema: collectorDetailSchema,
    });
  }

  create(input: NewCollectorInput) {
    return this.api.post("/admin/collectors", {
      body: input,
      schema: collectorDetailSchema,
    });
  }

  setStatus(id: string, change: StatusChange) {
    return this.api.post(`/admin/collectors/${enc(id)}/status`, {
      body: change,
      schema: collectorDetailSchema,
    });
  }

  async listHubs() {
    return (await this.api.get("/admin/hubs", { schema: hubListSchema })).items;
  }
}
