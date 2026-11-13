import type {
  AuthTokens,
  LoginInput,
  Staff,
} from "@/features/auth/data/models";

/** Talks to `/admin/auth/*` and `/admin/me`. Throws ApiError on failure. */
export type AuthSource = {
  login(input: LoginInput): Promise<AuthTokens>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  me(): Promise<Staff>;
};
