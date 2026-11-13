import { EncryptJWT, jwtDecrypt } from "jose";
import { z } from "zod";

import { roles } from "@/core/auth/roles";

/*
 * Seals the session into an encrypted cookie value (JWE, A256GCM). Pure and
 * free of Next imports, so proxy.ts and the server code share it.
 */

export const SESSION_COOKIE = "rethread_admin_session";

/** A shift is about 12 hours; staff sign in again after that. */
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

export const sessionStaffSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(roles),
});

export type SessionStaff = z.infer<typeof sessionStaffSchema>;

export const sessionSchema = z.object({
  staff: sessionStaffSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
  /** Epoch milliseconds when the access token stops working. */
  accessExpiresAt: z.number(),
});

export type Session = z.infer<typeof sessionSchema>;

async function keyFrom(secret: string): Promise<Uint8Array> {
  // Any length of secret becomes the 256-bit key A256GCM needs.
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );
  return new Uint8Array(digest);
}

export async function sealSession(
  session: Session,
  secret: string,
): Promise<string> {
  return new EncryptJWT({ session })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .encrypt(await keyFrom(secret));
}

/** The session, or null if the value is missing, tampered with or expired. */
export async function unsealSession(
  value: string | undefined,
  secret: string,
): Promise<Session | null> {
  if (!value) return null;
  try {
    const { payload } = await jwtDecrypt(value, await keyFrom(secret));
    const parsed = sessionSchema.safeParse(payload.session);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
} as const;
