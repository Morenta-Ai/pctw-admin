import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("signed-out visitors are sent to sign in, then back where they were", async ({
  page,
}) => {
  await page.goto("/pickups");
  await expect(page).toHaveURL(/\/login\?next=%2Fpickups/);

  await signIn(page, "admin", page.url());

  await expect(page).toHaveURL(/\/pickups$/);
  await expect(page.getByRole("heading", { name: "Pickups" })).toBeVisible();
});

test("a wrong password shows an error and keeps the email", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Work email").fill("admin@rethread.lk");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Next's route announcer is also role="alert", so match on the text.
  await expect(
    page.getByRole("alert").filter({ hasText: "Email or password is wrong." }),
  ).toBeVisible();
  await expect(page.getByLabel("Work email")).toHaveValue("admin@rethread.lk");
});

test("admins see every section and can sign out", async ({ page }) => {
  await signIn(page, "admin");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", {
      name: /Good (morning|afternoon|evening), Nadeesha/,
    }),
  ).toBeVisible();
  const nav = page.locator("[data-sidebar=content]");
  await expect(nav.getByRole("link", { name: "Rates & impact" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Staff" })).toBeVisible();

  await page.getByRole("button", { name: /Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("call-centre staff don't see or reach admin-only sections", async ({
  page,
}) => {
  await signIn(page, "callCentre");

  const nav = page.locator("[data-sidebar=content]");
  await expect(nav.getByRole("link", { name: "Live map" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Rates & impact" })).toHaveCount(
    0,
  );
  await expect(nav.getByRole("link", { name: "Catalogue" })).toHaveCount(0);

  await page.goto("/rates");

  await expect(page).toHaveURL(/\/forbidden$/);
  await expect(
    page.getByRole("heading", { name: "You don't have access to that" }),
  ).toBeVisible();
});
