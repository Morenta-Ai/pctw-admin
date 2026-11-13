import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import type { DispatchSource } from "@/features/dispatch/data/dispatch-source";
import { dispatchSchema } from "@/features/dispatch/data/models";

export class DispatchRemoteSource implements DispatchSource {
  constructor(private readonly api: ApiClient) {}

  getDispatch() {
    return this.api.get("/admin/dispatch", { schema: dispatchSchema });
  }
}
