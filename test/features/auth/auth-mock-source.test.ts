import { beforeEach, describe, expect, it } from "vitest";

import { createAuthRepository } from "@/features/auth/data/auth-repository";
import { AuthMockSource } from "@/features/auth/data/auth-mock-source";
import { resetMockWorld } from "@/mock/mock-world";

let accessToken: string | undefined;

function repository() {
  return createAuthRepository(
    new AuthMockSource(resetMockWorld(), async () => accessToken),
  );
}

beforeEach(() => {
  accessToken = undefined;
});

describe("auth mock source", () => {
  it("signs in an admin with the seeded password, ignoring email case", async () => {
    const result = await repository().login({
      email: "Admin@ReThread.lk",
      password: "rethread-admin",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.staff).toMatchObject({ id: "stf_1", role: "admin" });
      expect(result.data.accessToken).toMatch(/^mock\.stf_1\./);
    }
  });

  it("rejects a wrong password with INVALID_CREDENTIALS", async () => {
    const result = await repository().login({
      email: "callcentre@rethread.lk",
      password: "nope",
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "INVALID_CREDENTIALS", status: 401 },
    });
  });

  it("refuses a suspended account", async () => {
    const result = await repository().login({
      email: "ishara@rethread.lk",
      password: "rethread-callcentre",
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "ACCOUNT_SUSPENDED", status: 403 },
    });
  });

  it("answers /me for the token's owner", async () => {
    const repo = repository();
    const login = await repo.login({
      email: "callcentre@rethread.lk",
      password: "rethread-callcentre",
    });
    accessToken = login.ok ? login.data.accessToken : undefined;

    const me = await repo.me();

    expect(me).toMatchObject({ ok: true, data: { role: "callCentre" } });
  });

  it("treats an unknown token as an expired session", async () => {
    accessToken = "mock.stf_99.access.tok_1";

    const me = await repository().me();

    expect(me).toMatchObject({
      ok: false,
      error: { code: "SESSION_EXPIRED", status: 401 },
    });
  });
});
