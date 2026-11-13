import { describe, expect, it } from "vitest";

import {
  sealSession,
  unsealSession,
  type Session,
} from "@/core/auth/session-token";

const secret = "a-test-secret-that-is-at-least-32-chars";

const session: Session = {
  staff: {
    id: "stf_1",
    name: "Nadeesha Perera",
    email: "admin@rethread.lk",
    role: "admin",
  },
  accessToken: "access",
  refreshToken: "refresh",
  accessExpiresAt: 1_800_000_000_000,
};

describe("session token", () => {
  it("round-trips the session", async () => {
    const sealed = await sealSession(session, secret);

    expect(sealed).not.toContain("access");
    await expect(unsealSession(sealed, secret)).resolves.toEqual(session);
  });

  it("rejects a value sealed with another secret", async () => {
    const sealed = await sealSession(session, secret);

    await expect(
      unsealSession(sealed, "another-secret-that-is-32-chars-long"),
    ).resolves.toBeNull();
  });

  it("rejects tampered or missing values", async () => {
    const sealed = await sealSession(session, secret);
    const tampered = `${sealed.slice(0, -4)}AAAA`;

    await expect(unsealSession(tampered, secret)).resolves.toBeNull();
    await expect(unsealSession(undefined, secret)).resolves.toBeNull();
    await expect(unsealSession("not-a-token", secret)).resolves.toBeNull();
  });
});
