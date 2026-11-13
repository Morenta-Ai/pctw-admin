import "server-only";

import { ApiError } from "@/core/api/api-error";
import { SESSION_MAX_AGE_SECONDS } from "@/core/auth/session-token";
import type { AuthSource } from "@/features/auth/data/auth-source";
import type {
  AuthTokens,
  LoginInput,
  Staff,
} from "@/features/auth/data/models";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import { mockTokenFor, staffIdFromMockToken } from "@/mock/mock-tokens";
import type { MockStaffAccount } from "@/mock/seed/staff";

// Mock tokens last as long as the session cookie, so mock mode never
// needs a refresh.
const tokenFor = mockTokenFor;
const staffIdFrom = staffIdFromMockToken;

export class AuthMockSource implements AuthSource {
  constructor(
    private readonly world: MockWorld,
    private readonly getAccessToken: () => Promise<string | undefined>,
  ) {}

  async login({ email, password }: LoginInput): Promise<AuthTokens> {
    await mockLatency(400);
    const account = this.world.staff.find(
      (staff) => staff.email.toLowerCase() === email.toLowerCase(),
    );
    if (!account || account.password !== password) {
      throw new ApiError({
        code: "INVALID_CREDENTIALS",
        message: "Email or password is wrong.",
        status: 401,
      });
    }
    return this.issueTokens(account);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    await mockLatency();
    return this.issueTokens(this.activeAccount(staffIdFrom(refreshToken)));
  }

  async logout(): Promise<void> {
    await mockLatency();
  }

  async me(): Promise<Staff> {
    await mockLatency();
    const account = this.activeAccount(
      staffIdFrom(await this.getAccessToken()),
    );
    return toStaff(account);
  }

  private activeAccount(staffId: string | undefined): MockStaffAccount {
    const account = this.world.staff.find((staff) => staff.id === staffId);
    if (!account) {
      throw new ApiError({
        code: "SESSION_EXPIRED",
        message: "Sign in again.",
        status: 401,
      });
    }
    if (account.status === "suspended") throw suspended();
    return account;
  }

  private issueTokens(account: MockStaffAccount): AuthTokens {
    if (account.status === "suspended") throw suspended();
    const n = this.world.nextId("tok");
    return {
      accessToken: tokenFor(account.id, "access", n),
      refreshToken: tokenFor(account.id, "refresh", n),
      expiresIn: SESSION_MAX_AGE_SECONDS,
      staff: toStaff(account),
    };
  }
}

const toStaff = ({ id, name, email, role }: MockStaffAccount): Staff => ({
  id,
  name,
  email,
  role,
});

const suspended = () =>
  new ApiError({
    code: "ACCOUNT_SUSPENDED",
    message: "This account is suspended.",
    status: 403,
  });
