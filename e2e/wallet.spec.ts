import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("call centre pays one bank transfer and rejects another", async ({
  page,
}) => {
  await signIn(page, "callCentre");
  await page.goto("/redemptions?type=cash&status=pending");
  await expect(page.getByText(/3 bank transfers to make/)).toBeVisible();

  const first = page.getByRole("row").filter({ hasText: "red_1" });
  await first.getByRole("button", { name: "Mark paid" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Mark paid" }).click();
  await expect(
    dialog.getByText("Enter the bank's transfer reference."),
  ).toBeVisible();
  await dialog.getByLabel("Bank reference").fill("CEFT 1107-88213");
  await dialog.getByRole("button", { name: "Mark paid" }).click();
  await expect(page.getByText("red_1 marked paid.")).toBeVisible();

  const second = page.getByRole("row").filter({ hasText: "red_2" });
  await second.getByRole("button", { name: "Reject" }).click();
  await dialog.getByLabel("Reason").fill("The account name doesn't match.");
  await dialog.getByRole("button", { name: "Reject transfer" }).click();
  await expect(
    page.getByText("red_2 rejected.", { exact: false }),
  ).toBeVisible();

  await page.goto("/redemptions?type=cash");
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: "red_1" })
      .getByText("Ref CEFT 1107-88213"),
  ).toBeVisible();
});

test("an admin adds a donation project and closes it", async ({
  page,
}, testInfo) => {
  const name = `Tailoring co-op ${testInfo.retry}-${Date.now() % 100_000}`;
  await signIn(page, "admin");
  await page.goto("/donations");

  await page.getByRole("button", { name: "New project" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByLabel("Summary").fill("Livelihoods · 30 tailors");
  await dialog.getByLabel("Goal").fill("500");
  await dialog.getByRole("button", { name: "Add project" }).click();
  await expect(
    dialog.getByText("The goal must be at least Rs. 1,000."),
  ).toBeVisible();
  await dialog.getByLabel("Goal").fill("1500000");
  await dialog.getByRole("button", { name: "Add project" }).click();
  await expect(page.getByText(`${name} added.`)).toBeVisible();

  await page.getByRole("button", { name: `Edit ${name}` }).click();
  await page.getByRole("dialog").getByRole("switch").click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save project" })
    .click();
  await expect(page.getByText("Project saved.")).toBeVisible();
});
