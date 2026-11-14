import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("open an alert from the bell, then mark everything read", async ({
  page,
}) => {
  await signIn(page, "admin");

  const bell = page.getByRole("button", {
    name: /^Notifications, \d+ unread$/,
  });
  await expect(bell).toBeVisible({ timeout: 15_000 });
  await bell.click();
  await page
    .getByRole("button", { name: /New pickup RT-24844/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/pickups\/RT-24844$/, { timeout: 15_000 });

  await page.goto("/notifications?show=unread");
  await expect(page.getByRole("tab", { name: /Unread \(\d+\)/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /New pickup RT-24844/ }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Mark all read" }).click();
  await expect(page.getByText("You're all caught up")).toBeVisible();
  // Other specs keep creating alerts in parallel, so check this page, not
  // an exact count on the bell.
  await expect(page.getByRole("tab", { name: /Unread \(0\)/ })).toBeVisible();
});
