import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import { DEFAULT_PAGE_SIZE } from "@/core/paged";
import {
  pickupDetailSchema,
  pickupPageSchema,
  type PickupQuery,
} from "@/features/pickups/data/models";
import type { PickupsSource } from "@/features/pickups/data/pickups-source";

export class PickupsRemoteSource implements PickupsSource {
  constructor(private readonly api: ApiClient) {}

  list(query: PickupQuery) {
    return this.api.get("/admin/pickups", {
      query: { ...query, pageSize: DEFAULT_PAGE_SIZE },
      schema: pickupPageSchema,
    });
  }

  get(id: string) {
    return this.api.get(`/admin/pickups/${encodeURIComponent(id)}`, {
      schema: pickupDetailSchema,
    });
  }

  cancel(id: string, reason: string) {
    return this.api.post(`/admin/pickups/${encodeURIComponent(id)}/cancel`, {
      body: { reason },
      schema: pickupDetailSchema,
    });
  }
}
