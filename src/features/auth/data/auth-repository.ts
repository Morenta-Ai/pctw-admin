import "server-only";

import { getAccessToken, getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import { guard, type Result } from "@/core/result";
import { AuthMockSource } from "@/features/auth/data/auth-mock-source";
import { AuthRemoteSource } from "@/features/auth/data/auth-remote-source";
import type { AuthSource } from "@/features/auth/data/auth-source";
import type {
  AuthTokens,
  LoginInput,
  Staff,
} from "@/features/auth/data/models";
import { getMockWorld } from "@/mock/mock-world";

export type AuthRepository = {
  login(input: LoginInput): Promise<Result<AuthTokens>>;
  refresh(refreshToken: string): Promise<Result<AuthTokens>>;
  logout(refreshToken: string): Promise<Result<void>>;
  me(): Promise<Result<Staff>>;
};

export function createAuthRepository(source: AuthSource): AuthRepository {
  return {
    login: (input) => guard(() => source.login(input)),
    refresh: (token) => guard(() => source.refresh(token)),
    logout: (token) => guard(() => source.logout(token)),
    me: () => guard(() => source.me()),
  };
}

export function getAuthRepository(): AuthRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new AuthMockSource(getMockWorld(), getAccessToken)
    : new AuthRemoteSource(getApiClient());
  return createAuthRepository(source);
}
