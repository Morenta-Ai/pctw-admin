import type { Session } from "@/core/auth/session-token";
import { authTokensSchema, type AuthTokens } from "@/features/auth/data/models";

/** Refresh this long before the access token actually expires. */
export const REFRESH_LEEWAY_MS = 60_000;

export function needsRefresh(session: Session, now = Date.now()): boolean {
  return session.accessExpiresAt - REFRESH_LEEWAY_MS <= now;
}

export function sessionFromTokens(
  tokens: AuthTokens,
  now = Date.now(),
): Session {
  return {
    staff: tokens.staff,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessExpiresAt: now + tokens.expiresIn * 1000,
  };
}

/**
 * Swaps the refresh token for new tokens. Used by proxy.ts, which runs before
 * rendering and is the one place a refreshed cookie can reach both the
 * browser and the page about to render. Null means "sign in again".
 */
export async function refreshSession(
  session: Session,
  apiBaseUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Session | null> {
  try {
    const response = await fetchImpl(
      `${apiBaseUrl.replace(/\/+$/, "")}/admin/auth/refresh`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const tokens = authTokensSchema.safeParse(await response.json());
    return tokens.success ? sessionFromTokens(tokens.data) : null;
  } catch {
    // Network failure or timeout: treat it like an expired session.
    return null;
  }
}
