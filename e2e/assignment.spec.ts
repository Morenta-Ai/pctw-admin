import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("offer a pickup: a busy collector declines, a free one accepts", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await signIn(page, "callCentre");
  await page.goto("/pickups/RT-24830");

  await page.getByRole("button", { name: "Assign collector" }).click();
  const dialog = page.getByRole("dialog");

  // Ruwan is on RT-24817, so the mock collector declines.
  await dialog.getByRole("radio", { name: /Ruwan Silva/ }).check();
  await dialog.getByRole("button", { name: "Send offer" }).click();
  await expect(
    dialog.getByText("Waiting for Ruwan Silva to answer"),
  ).toBeVisible();
  await expect(dialog.getByText("Ruwan Silva declined")).toBeVisible({
    timeout: 15_000,
  });
  await expect(dialog.getByText("Reason: Already on a job.")).toBeVisible();

  await dialog.getByRole("button", { name: "Offer to someone else" }).click();
  await dialog.getByRole("radio", { name: /Lahiru Gunasekara/ }).check();
  await dialog.getByLabel(/Note for the collector/).fill("Gate code 4412");
  await dialog.getByRole("button", { name: "Send offer" }).click();
  await expect(dialog.getByText("Lahiru Gunasekara accepted")).toBeVisible({
    timeout: 15_000,
  });
  await dialog.getByRole("button", { name: "Done" }).click();

  await expect(
    page.getByText("Assigned", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Call-centre offers")).toBeVisible();
  await expect(page.getByText("Note: Gate code 4412")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Assign collector" }),
  ).toHaveCount(0);
});
