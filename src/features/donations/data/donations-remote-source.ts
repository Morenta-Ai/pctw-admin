import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import type { DonationsSource } from "@/features/donations/data/donations-source";
import {
  donationProjectListSchema,
  donationProjectSchema,
  type DonationProjectInput,
} from "@/features/donations/data/models";

export class DonationsRemoteSource implements DonationsSource {
  constructor(private readonly api: ApiClient) {}

  async list() {
    return (
      await this.api.get("/admin/donation-projects", {
        schema: donationProjectListSchema,
      })
    ).items;
  }

  create(input: DonationProjectInput) {
    return this.api.post("/admin/donation-projects", {
      body: input,
      schema: donationProjectSchema,
    });
  }

  update(id: string, input: Partial<DonationProjectInput>) {
    return this.api.patch(
      `/admin/donation-projects/${encodeURIComponent(id)}`,
      {
        body: input,
        schema: donationProjectSchema,
      },
    );
  }
}
