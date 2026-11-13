import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

// A 1×1 PNG.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("an admin adds a product with a photo, then hides it from the list", async ({
  page,
}, testInfo) => {
  // Unique per attempt: a retry runs against the same server and MockWorld.
  const name = `Sarong Tote ${testInfo.retry}-${Date.now() % 100_000}`;

  await signIn(page, "admin");
  await page.goto("/catalogue");
  await page.getByRole("link", { name: "New product" }).click();

  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByText("Give the product a name.")).toBeVisible();

  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("combobox", { name: "Category" }).click();
  await page.getByRole("option", { name: "Accessories" }).click();
  await page.getByLabel("Price", { exact: true }).fill("850");
  await page.getByLabel("Stock", { exact: true }).fill("12");
  await page.getByRole("button", { name: "One size" }).click();
  await page.getByLabel("Story").fill("Two worn sarongs, one sturdy bag.");
  await page.getByLabel("Upload photos").setInputFiles({
    name: "tote.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByText("Cover")).toBeVisible();

  await page.getByRole("button", { name: "Add product" }).click();
  // Wait on the navigation, not the toast: CI can be slow enough to miss it.
  await expect(page).toHaveURL(/\/catalogue\/prd_\d+$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name })).toBeVisible();

  await page.goto(`/catalogue?uploaded=today&q=${encodeURIComponent(name)}`);
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row.getByText("In the shop")).toBeVisible();
  await row.getByRole("switch", { name: `Show ${name} in the shop` }).click();
  await expect(row.getByText("Hidden")).toBeVisible();
});

test("call-centre staff can't upload photos", async ({ page }) => {
  await signIn(page, "callCentre");
  const response = await page.request.post("/api/uploads", {
    multipart: { file: { name: "a.png", mimeType: "image/png", buffer: png } },
  });
  expect(response.status()).toBe(403);
});
