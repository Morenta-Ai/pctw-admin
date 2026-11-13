import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("the live map lists waiting pickups and suggests nearby collectors", async ({
  page,
}) => {
  await signIn(page, "callCentre");
  await page.goto("/dispatch");

  await expect(page.getByText(/Waiting for a collector \(\d+\)/)).toBeVisible();
  await expect(page.getByText("Live · updates every 10 s")).toBeVisible();

  await page
    .getByRole("button", { name: /^RT-24822/ })
    .first()
    .click();
  await expect(page.getByText("Nearest available collectors")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open pickup" })).toHaveAttribute(
    "href",
    "/pickups/RT-24822",
  );

  await page.getByRole("tab", { name: /Collectors/ }).click();
  await expect(
    page.getByRole("button", { name: /Ruwan Silva/ }).first(),
  ).toBeVisible();
});

test("the polling endpoint needs a session", async ({ request }) => {
  const response = await request.get("/api/dispatch");
  expect(response.status()).toBe(401);
});
