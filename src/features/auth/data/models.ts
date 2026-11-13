import { z } from "zod";

import { sessionStaffSchema } from "@/core/auth/session-token";

/** `staff` in the login response and `GET /admin/me`. */
export const staffSchema = sessionStaffSchema;
export type Staff = z.infer<typeof staffSchema>;

export const loginInputSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

/** `POST /admin/auth/login` and `POST /admin/auth/refresh`. */
export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  /** Seconds until the access token expires. */
  expiresIn: z.number().int().positive(),
  staff: staffSchema,
});
export type AuthTokens = z.infer<typeof authTokensSchema>;
