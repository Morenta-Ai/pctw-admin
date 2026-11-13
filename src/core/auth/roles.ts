/** Staff roles, as the API sends them. */
export const roles = ["admin", "callCentre"] as const;
export type Role = (typeof roles)[number];

export const roleLabels: Record<Role, string> = {
  admin: "Admin",
  callCentre: "Call Centre",
};

/**
 * Sections only admins may open. Everything else in the portal is open to
 * both roles. Checked by proxy.ts for pages and by requireRole() on the
 * server, so keep this the one place that decides.
 */
export const adminOnlyPrefixes = [
  "/rates",
  "/catalogue",
  "/donations",
  "/staff",
] as const;

/** Pages anyone may open without signing in. */
export const publicPaths = ["/login"] as const;

const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => matches(pathname, path));
}

export function isAdminOnlyPath(pathname: string): boolean {
  return adminOnlyPrefixes.some((prefix) => matches(pathname, prefix));
}

export function canAccess(role: Role, pathname: string): boolean {
  return role === "admin" || !isAdminOnlyPath(pathname);
}

/**
 * A `next` redirect target from the login form, only if it's a path in this
 * app. Anything else (`//evil.com`, `https://…`) falls back to the dashboard.
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.startsWith("/\\") || isPublicPath(next)) return fallback;
  return next;
}

export type AccessDecision =
  | "allow"
  /** Signed out on a portal page: go to /login. */
  | "login"
  /** Signed in on /login: go to the dashboard. */
  | "home"
  /** Signed in, but the role can't open this section. */
  | "forbidden";

/** What proxy.ts does with a page request. */
export function accessDecision(
  pathname: string,
  role: Role | undefined,
): AccessDecision {
  if (isPublicPath(pathname)) return role ? "home" : "allow";
  if (!role) return "login";
  return canAccess(role, pathname) ? "allow" : "forbidden";
}
