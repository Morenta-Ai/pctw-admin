import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import {
  multipliersSchema,
  ratesSchema,
  type MultipliersInput,
  type NewRatesInput,
} from "@/features/rates/data/models";
import type { RatesSource } from "@/features/rates/data/rates-source";

export class RatesRemoteSource implements RatesSource {
  constructor(private readonly api: ApiClient) {}

  getRates() {
    return this.api.get("/admin/rates", { schema: ratesSchema });
  }

  setRates(input: NewRatesInput) {
    return this.api.post("/admin/rates", { body: input, schema: ratesSchema });
  }

  cancelScheduled() {
    return this.api.delete("/admin/rates/scheduled", { schema: ratesSchema });
  }

  getMultipliers() {
    return this.api.get("/admin/impact-multipliers", {
      schema: multipliersSchema,
    });
  }

  updateMultipliers(input: MultipliersInput) {
    return this.api.put("/admin/impact-multipliers", {
      body: input,
      schema: multipliersSchema,
    });
  }
}
