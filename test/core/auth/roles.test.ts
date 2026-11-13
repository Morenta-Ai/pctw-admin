import { describe, expect, it } from "vitest";

import { canAccess, isPublicPath, safeRedirectPath } from "@/core/auth/roles";

describe("canAccess", () => {
  it("lets admins open everything", () => {
    expect(canAccess("admin", "/rates")).toBe(true);
    expect(canAccess("admin", "/staff/stf_2")).toBe(true);
  });

  it("keeps call-centre staff out of admin-only sections", () => {
    expect(canAccess("callCentre", "/dispatch")).toBe(true);
    expect(canAccess("callCentre", "/orders/ORD-10234")).toBe(true);
    expect(canAccess("callCentre", "/rates")).toBe(false);
    expect(canAccess("callCentre", "/catalogue/new")).toBe(false);
    expect(canAccess("callCentre", "/donations")).toBe(false);
    expect(canAccess("callCentre", "/staff")).toBe(false);
  });

  it("matches whole path segments only", () => {
    expect(canAccess("callCentre", "/ratesheet")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/loginx")).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("keeps paths inside the portal", () => {
    expect(safeRedirectPath("/orders?status=placed")).toBe(
      "/orders?status=placed",
    );
  });

  it("refuses anything that could leave the site", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/login")).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
  });
});
