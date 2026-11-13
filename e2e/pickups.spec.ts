import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("find a pickup, open it and cancel it with a reason", async ({ page }) => {
  await signIn(page, "callCentre");
  await page.goto("/pickups?date=today&status=pending");

  await page
    .getByRole("searchbox", { name: "Search pickups" })
    .fill("rajagiriya");
  await expect(page).toHaveURL(/q=rajagiriya/);
  const row = page.getByRole("row").filter({ hasText: "RT-24841" });
  await expect(row).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(2); // header + RT-24841

  await row.getByRole("link", { name: "RT-24841" }).click();
  await expect(page.getByRole("heading", { name: "RT-24841" })).toBeVisible();
  await expect(page.getByText("Not assigned yet")).toBeVisible();

  await page.getByRole("button", { name: "Cancel pickup" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Reason")
    .fill("Customer called: travelling this week.");
  await dialog.getByRole("button", { name: "Cancel pickup" }).click();

  await expect(page.getByText("RT-24841 cancelled.")).toBeVisible();
  await expect(
    page.getByText("Customer called: travelling this week."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel pickup" })).toHaveCount(
    0,
  );
});

test("an unknown pickup shows a not-found page", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/pickups/RT-1");

  await expect(page.getByText("No pickup with that ID")).toBeVisible();
});
