import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("call centre finds a customer, then suspends and reactivates another", async ({
  page,
}) => {
  await signIn(page, "callCentre");
  await page.goto("/customers");
  await page
    .getByRole("searchbox", { name: "Search customers" })
    .fill("nadeesha");
  await expect(page).toHaveURL(/q=nadeesha/);
  await expect(page.getByRole("row")).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: "Nadeesha Perera" }),
  ).toHaveAttribute("href", "/customers/cus_1");
  await page.goto("/customers/cus_1");
  await expect(page.getByText("Wallet balance")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("link", { name: "RT-24817" })).toBeVisible();

  await page.goto("/customers/cus_20");
  await page.getByRole("button", { name: "Suspend" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Suspend" }).click();
  await expect(
    dialog.getByText("Say why the account is suspended."),
  ).toBeVisible();
  await dialog
    .getByLabel("Reason")
    .fill("Booked pickups with nothing to collect.");
  await dialog.getByRole("button", { name: "Suspend" }).click();
  await expect(
    page.getByText("Suspended", { exact: true }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Reactivate" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reactivate" })
    .click();
  await expect(page.getByText("Active", { exact: true })).toBeVisible();
});

test("call centre registers a collector", async ({ page }, testInfo) => {
  const mobile = `077${String(1_000_000 + ((Date.now() + testInfo.retry) % 9_000_000)).slice(0, 7)}`;
  await signIn(page, "callCentre");
  await page.goto("/collectors");
  await page.getByRole("button", { name: "New collector" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("First name").fill("Kasun");
  await dialog.getByLabel("Last name").fill("Perera");
  await dialog.getByLabel("Mobile").fill(mobile);
  await dialog.getByLabel("Area").fill("Kotte");
  await dialog.getByRole("combobox", { name: "Hub" }).click();
  await page.getByRole("option", { name: /Peliyagoda/ }).click();
  await dialog.getByRole("combobox", { name: "Vehicle" }).click();
  await page.getByRole("option", { name: "Three-wheeler" }).click();
  await expect(dialog.getByLabel("Carries up to (kg)")).toHaveValue("120");
  await dialog.getByLabel("Number plate").fill("wp abq-7788");
  await dialog.getByRole("button", { name: "Register collector" }).click();

  await expect(page).toHaveURL(/\/collectors\/col_\d+$/, { timeout: 15_000 });
  await expect(page.getByText(/^COL-\d{4}$/)).toBeVisible();
  await expect(page.getByText(/WP ABQ-7788/)).toBeVisible();
});

test("an admin invites staff, promotes and suspends them, but can't change themselves", async ({
  page,
}, testInfo) => {
  const email = `new${testInfo.retry}${Date.now() % 100_000}@rethread.lk`;
  await signIn(page, "admin");
  await page.goto("/staff");

  const me = page.getByRole("row").filter({ hasText: "(you)" });
  await expect(me.getByRole("button", { name: "Suspend" })).toHaveCount(0);

  await page.getByRole("button", { name: "Invite staff" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("Dilini Wickramasinghe");
  await dialog.getByLabel("Work email").fill(email);
  await dialog.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByText(`Invite sent to ${email}.`)).toBeVisible();

  const row = page.getByRole("row").filter({ hasText: email });
  await expect(row.getByText("Invited, not yet signed in")).toBeVisible();
  await row.getByRole("combobox", { name: /Role for/ }).click();
  await page.getByRole("option", { name: "Admin" }).click();
  await expect(row.getByText("Admin", { exact: true }).first()).toBeVisible();
  await row.getByRole("button", { name: "Suspend" }).click();
  await expect(row.getByText("Suspended")).toBeVisible();
});
