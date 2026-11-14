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

/*
 * All specs share one server and one MockWorld, and run in parallel. A spec
 * that changes data owns its records; keep them distinct:
 *   pickups.spec    cancels RT-24841
 *   assignment.spec assigns RT-24830
 *   orders.spec     moves ORD-5134
 *   rates.spec      changes the rates and multipliers
 *   catalogue.spec  adds and hides its own new product
 *   people.spec     suspends cus_20; creates its own collector and staff
 *   wallet.spec     pays red_1, rejects red_2; creates its own project
 *   notifications   reads the admin's notifications
 * Read-only specs should use other records (RT-24822, RT-24844 …).
 */
