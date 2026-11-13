import "server-only";

import { ApiClient } from "@/core/api/api-client";
import { getSession } from "@/core/auth/session";
import { getEnv } from "@/core/config/env";

/** The API client for remote sources, authenticated as the signed-in staff member. */
export function getApiClient(): ApiClient {
  const env = getEnv();
  return new ApiClient({
    baseUrl: env.API_BASE_URL,
    timeoutMs: env.API_TIMEOUT_MS,
    getAccessToken: async () => (await getSession())?.accessToken,
  });
}

/** The access token mock sources use to tell who is calling. */
export async function getAccessToken(): Promise<string | undefined> {
  return (await getSession())?.accessToken;
}
