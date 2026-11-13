import { describe, expect, it, vi } from "vitest";

import type { Session } from "@/core/auth/session-token";
import { needsRefresh, refreshSession } from "@/features/auth/session-refresh";

const session: Session = {
  staff: {
    id: "stf_2",
    name: "Kasun Jayawardena",
    email: "callcentre@rethread.lk",
    role: "callCentre",
  },
  accessToken: "old-access",
  refreshToken: "old-refresh",
  accessExpiresAt: 1_000_000,
};

describe("needsRefresh", () => {
  it("refreshes within a minute of expiry", () => {
    expect(needsRefresh(session, 1_000_000 - 120_000)).toBe(false);
    expect(needsRefresh(session, 1_000_000 - 30_000)).toBe(true);
  });
});

describe("refreshSession", () => {
  it("swaps the refresh token for a new session", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({
        accessToken: "new-access",
        refreshToken: "new-refresh",
        expiresIn: 900,
        staff: session.staff,
      }),
    );

    const refreshed = await refreshSession(
      session,
      "https://api.test/api/v1/",
      fetchMock,
    );

    expect(refreshed).toMatchObject({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.test/api/v1/admin/auth/refresh");
    expect(init?.body).toBe('{"refreshToken":"old-refresh"}');
  });

  it("returns null when the API says the session is over", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({ code: "SESSION_EXPIRED", message: "x" }, { status: 401 }),
    );

    await expect(
      refreshSession(session, "https://api.test/api/v1", fetchMock),
    ).resolves.toBeNull();
  });

  it("returns null when the API can't be reached", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(
      refreshSession(session, "https://api.test/api/v1", fetchMock),
    ).resolves.toBeNull();
  });
});
