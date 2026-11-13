import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import type { AssignmentsSource } from "@/features/assignments/data/assignments-source";
import {
  assignmentListSchema,
  assignmentSchema,
  type OfferInput,
} from "@/features/assignments/data/models";

const enc = encodeURIComponent;

export class AssignmentsRemoteSource implements AssignmentsSource {
  constructor(private readonly api: ApiClient) {}

  offer(pickupId: string, input: OfferInput) {
    return this.api.post(`/admin/pickups/${enc(pickupId)}/assignments`, {
      body: input,
      schema: assignmentSchema,
    });
  }

  async listForPickup(pickupId: string) {
    const { items } = await this.api.get(
      `/admin/pickups/${enc(pickupId)}/assignments`,
      { schema: assignmentListSchema },
    );
    return items;
  }

  get(id: string) {
    return this.api.get(`/admin/assignments/${enc(id)}`, {
      schema: assignmentSchema,
    });
  }

  withdraw(id: string) {
    return this.api.post(`/admin/assignments/${enc(id)}/withdraw`, {
      schema: assignmentSchema,
    });
  }
}
