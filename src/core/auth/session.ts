import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { Role } from "@/core/auth/roles";
import {
  SESSION_COOKIE,
  sealSession,
  sessionCookieOptions,
  unsealSession,
  type Session,
  type SessionStaff,
} from "@/core/auth/session-token";
import { getSessionSecret } from "@/core/config/env";

/** The signed-in staff member's session, read once per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return unsealSession(value, getSessionSecret());
});

/** Only in Server Actions and route handlers, where cookies can be set. */
export async function saveSession(session: Session): Promise<void> {
  const sealed = await sealSession(session, getSessionSecret());
  (await cookies()).set(SESSION_COOKIE, sealed, sessionCookieOptions);
}

/** Only in Server Actions and route handlers. */
export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The staff member, or a redirect to sign in. */
export async function requireStaff(): Promise<SessionStaff> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.staff;
}

/**
 * The staff member if their role is allowed, otherwise a redirect to
 * /forbidden. Call it at the top of every page, Server Action and route
 * handler that reads or changes data: proxy.ts is a convenience, not the
 * security boundary.
 */
export async function requireRole(...allowed: Role[]): Promise<SessionStaff> {
  const staff = await requireStaff();
  if (allowed.length > 0 && !allowed.includes(staff.role)) {
    redirect("/forbidden");
  }
  return staff;
}
