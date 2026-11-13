import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import type { AuthSource } from "@/features/auth/data/auth-source";
import {
  authTokensSchema,
  staffSchema,
  type LoginInput,
} from "@/features/auth/data/models";

export class AuthRemoteSource implements AuthSource {
  constructor(private readonly api: ApiClient) {}

  login(input: LoginInput) {
    return this.api.post("/admin/auth/login", {
      body: input,
      schema: authTokensSchema,
    });
  }

  refresh(refreshToken: string) {
    return this.api.post("/admin/auth/refresh", {
      body: { refreshToken },
      schema: authTokensSchema,
    });
  }

  async logout(refreshToken: string) {
    await this.api.post("/admin/auth/logout", { body: { refreshToken } });
  }

  me() {
    return this.api.get("/admin/me", { schema: staffSchema });
  }
}
