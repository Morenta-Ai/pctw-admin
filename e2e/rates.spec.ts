import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("an admin changes the price per kg, schedules a change and edits a multiplier", async ({
  page,
}) => {
  await signIn(page, "admin");
  await page.goto("/rates");

  await page.getByRole("button", { name: "Change rates" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Customer earns per kg").fill("125");
  await expect(
    dialog.getByText("For a 10 kg pickup the customer earns"),
  ).toContainText("Rs. 1,250.00");
  await dialog.getByRole("button", { name: "Save rates" }).click();
  await expect(page.getByText("New rates are in force now.")).toBeVisible();
  await expect(page.getByText("Rs. 125.00").first()).toBeVisible();

  await page.getByRole("button", { name: "Change rates" }).click();
  await dialog.getByLabel("Collector earns per kg").fill("130");
  await dialog.getByRole("button", { name: "Save rates" }).click();
  await expect(
    dialog.getByText(
      "The collector rate can't be more than the customer rate.",
    ),
  ).toBeVisible();
  await dialog.getByLabel("Collector earns per kg").fill("42");
  await dialog.getByLabel("Starts on").fill("2099-01-01");
  await dialog.getByRole("button", { name: "Save rates" }).click();
  await expect(page.getByText(/Change scheduled for 1 Jan 2099/)).toBeVisible();
  await page.getByRole("button", { name: "Cancel change" }).click();
  await expect(page.getByText(/Change scheduled for/)).toHaveCount(0);

  await page.getByLabel("Forex saved").fill("0.50");
  await expect(page.getByText("USD 5.00")).toBeVisible();
  await page.getByRole("button", { name: "Save multipliers" }).click();
  await expect(page.getByText(/Impact multipliers saved/)).toBeVisible();
});
