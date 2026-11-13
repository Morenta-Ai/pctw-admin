import { expect, type Page } from "@playwright/test";

export const accounts = {
  admin: { email: "admin@rethread.lk", password: "rethread-admin" },
  callCentre: {
    email: "callcentre@rethread.lk",
    password: "rethread-callcentre",
  },
} as const;

export async function signIn(
  page: Page,
  who: keyof typeof accounts,
  path = "/login",
) {
  await page.goto(path);
  await page.getByLabel("Work email").fill(accounts[who].email);
  await page.getByLabel("Password").fill(accounts[who].password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
