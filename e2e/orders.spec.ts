import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("confirm a new order, print its waybill and deliver it", async ({
  page,
  context,
}) => {
  await signIn(page, "callCentre");
  await expect(
    page
      .locator("[data-sidebar=content]")
      .getByLabel(/\d+ waiting/)
      .first(),
  ).toBeVisible();

  await page.goto("/orders?status=placed");
  await page.getByRole("link", { name: "ORD-5134" }).click();
  await expect(page.getByRole("heading", { name: "ORD-5134" })).toBeVisible();

  await page.getByRole("button", { name: "Confirm & create waybill" }).click();
  await expect(
    page.getByText(/ORD-5134 confirmed\. Waybill WB-\d{6}-\d{4}/),
  ).toBeVisible();

  const [waybill] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("link", { name: "Print waybill" }).click(),
  ]);
  await expect(waybill.getByText("Waybill", { exact: true })).toBeVisible();
  await expect(waybill.getByText(/^WB-\d{6}-\d{4}$/)).toBeVisible();
  await expect(waybill.getByText("Prepaid · no cash to collect")).toBeVisible();
  await waybill.close();

  await page.getByRole("button", { name: "Mark out for delivery" }).click();
  await expect(
    page.getByText("Out for delivery", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark delivered" }).click();
  await expect(
    page.getByText("Completed", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel order" })).toHaveCount(
    0,
  );
});
