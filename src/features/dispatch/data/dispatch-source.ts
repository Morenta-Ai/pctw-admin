import type { Dispatch } from "@/features/dispatch/data/models";

/** Talks to `GET /admin/dispatch`. Throws ApiError on failure. */
export type DispatchSource = {
  getDispatch(): Promise<Dispatch>;
};
