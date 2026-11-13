import { NextResponse, type NextRequest } from "next/server";

import { accessDecision } from "@/core/auth/roles";
import {
  SESSION_COOKIE,
  sealSession,
  sessionCookieOptions,
  unsealSession,
} from "@/core/auth/session-token";
import { getEnv, getSessionSecret } from "@/core/config/env";
import { needsRefresh, refreshSession } from "@/features/auth/session-refresh";

/**
 * Sends signed-out staff to /login, keeps call-centre staff out of
 * admin-only sections, and refreshes the API access token before it
 * expires. This is a convenience: pages, Server Actions and route handlers
 * still check the role themselves with requireRole().
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const secret = getSessionSecret();
  let session = await unsealSession(
    request.cookies.get(SESSION_COOKIE)?.value,
    secret,
  );
  const isApi = pathname.startsWith("/api/");

  let refreshedCookie: string | undefined;
  if (session && !getEnv().USE_MOCK_DATA && needsRefresh(session)) {
    session = await refreshSession(session, getEnv().API_BASE_URL);
    if (session) refreshedCookie = await sealSession(session, secret);
  }

  if (isApi) {
    if (!session) {
      return NextResponse.json(
        { code: "UNAUTHENTICATED", message: "Sign in again." },
        { status: 401 },
      );
    }
    return withSession(request, refreshedCookie);
  }

  switch (accessDecision(pathname, session?.staff.role)) {
    case "login": {
      const url = new URL("/login", request.url);
      if (pathname !== "/") url.searchParams.set("next", pathname + search);
      const response = NextResponse.redirect(url);
      // A cookie we couldn't refresh or read is useless; drop it.
      if (request.cookies.has(SESSION_COOKIE)) {
        response.cookies.delete(SESSION_COOKIE);
      }
      return response;
    }
    case "home":
      return NextResponse.redirect(new URL("/dashboard", request.url));
    case "forbidden":
      return NextResponse.redirect(new URL("/forbidden", request.url));
    case "allow":
      return withSession(request, refreshedCookie);
  }
}

/** Passes the request on, carrying a refreshed session to the page and the browser. */
function withSession(request: NextRequest, refreshedCookie?: string) {
  if (!refreshedCookie) return NextResponse.next();
  request.cookies.set(SESSION_COOKIE, refreshedCookie);
  const response = NextResponse.next({
    request: { headers: request.headers },
  });
  response.cookies.set(SESSION_COOKIE, refreshedCookie, sessionCookieOptions);
  return response;
}

export const config = {
  // Everything except Next's assets, the app icon and the public sign-in
  // page's static files.
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|favicon.ico|robots.txt).*)",
  ],
};
