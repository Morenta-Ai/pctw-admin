import type { Dashboard } from "@/features/dashboard/data/models";

/** Talks to `GET /admin/dashboard`. Throws ApiError on failure. */
export type DashboardSource = {
  getDashboard(): Promise<Dashboard>;
};
