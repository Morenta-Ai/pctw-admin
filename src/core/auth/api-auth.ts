import "server-only";

import { NextResponse } from "next/server";

import type { Role } from "@/core/auth/roles";
import { getSession } from "@/core/auth/session";
import type { SessionStaff } from "@/core/auth/session-token";

/**
 * requireRole() for route handlers: answers with a JSON 401 or 403 instead
 * of redirecting, since the caller is fetch(), not a browser page.
 */
export async function authorizeApi(
  ...allowed: Role[]
): Promise<{ staff: SessionStaff } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json(
        { code: "UNAUTHENTICATED", message: "Sign in again." },
        { status: 401 },
      ),
    };
  }
  if (allowed.length > 0 && !allowed.includes(session.staff.role)) {
    return {
      response: NextResponse.json(
        { code: "FORBIDDEN", message: "You don't have access to do that." },
        { status: 403 },
      ),
    };
  }
  return { staff: session.staff };
}
