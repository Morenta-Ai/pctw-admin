import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import {
  redemptionPageSchema,
  redemptionSchema,
  type RedemptionQuery,
} from "@/features/redemptions/data/models";
import type { RedemptionsSource } from "@/features/redemptions/data/redemptions-source";

const enc = encodeURIComponent;

export class RedemptionsRemoteSource implements RedemptionsSource {
  constructor(private readonly api: ApiClient) {}

  list(query: RedemptionQuery) {
    return this.api.get("/admin/redemptions", {
      query: { ...query, pageSize: 25 },
      schema: redemptionPageSchema,
    });
  }

  pay(id: string, reference: string) {
    return this.api.post(`/admin/redemptions/${enc(id)}/pay`, {
      body: { reference },
      schema: redemptionSchema,
    });
  }

  reject(id: string, reason: string) {
    return this.api.post(`/admin/redemptions/${enc(id)}/reject`, {
      body: { reason },
      schema: redemptionSchema,
    });
  }
}
