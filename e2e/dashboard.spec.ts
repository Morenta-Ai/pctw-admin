import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("the dashboard shows today's figures and the call centre's queue", async ({
  page,
}) => {
  await signIn(page, "callCentre");

  await expect(page.getByText("Pickups today")).toBeVisible();
  await expect(page.getByText("Collected today")).toBeVisible();
  await expect(page.getByText("Collectors online")).toBeVisible();
  await expect(
    page.getByText(/pickups? (has|have) waited over 30 minutes/),
  ).toBeVisible();
  await expect(
    page.getByText("Recent activity", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /New pickup RT-24844/ }),
  ).toBeVisible();
});
