import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import type { DashboardSource } from "@/features/dashboard/data/dashboard-source";
import { dashboardSchema } from "@/features/dashboard/data/models";

export class DashboardRemoteSource implements DashboardSource {
  constructor(private readonly api: ApiClient) {}

  getDashboard() {
    return this.api.get("/admin/dashboard", { schema: dashboardSchema });
  }
}
