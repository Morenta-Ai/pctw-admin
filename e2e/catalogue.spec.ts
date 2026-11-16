import { deflateSync } from "node:zlib";

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
  await expect(page).toHaveURL(/\/catalogue\/prd_[a-z0-9]+$/, {
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name })).toBeVisible();

  await page.goto(`/catalogue?uploaded=today&q=${encodeURIComponent(name)}`);
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row.getByText("In the shop")).toBeVisible();
  await row.getByRole("switch", { name: `Show ${name} in the shop` }).click();
  await expect(row.getByText("Hidden")).toBeVisible();
});

test("a large phone photo is made smaller before it uploads", async ({
  page,
}) => {
  await signIn(page, "admin");
  await page.goto("/catalogue/new");
  const upload = page.waitForResponse(
    (r) => r.url().endsWith("/api/uploads") && r.request().method() === "POST",
  );
  // 2400 × 1800 of noise: about 4.7 MB as a PNG, over the 4 MB limit, like a phone photo.
  await page.getByLabel("Upload photos").setInputFiles({
    name: "rack.png",
    mimeType: "image/png",
    buffer: noisePng(2400, 1800),
  });

  // Unshrunk, it would be refused: the limit is 4 MB.
  const response = await upload;
  expect(response.status()).toBe(201);
  const { url } = (await response.json()) as { url: string };
  const stored = await page.request.get(url);
  expect(stored.headers()["content-type"]).toBe("image/jpeg");
  expect((await stored.body()).length).toBeLessThan(4 * 1024 * 1024);
  await expect(page.getByText("Cover", { exact: true })).toBeVisible();
});

test("call-centre staff can't upload photos", async ({ page }) => {
  await signIn(page, "callCentre");
  const response = await page.request.post("/api/uploads", {
    multipart: { file: { name: "a.png", mimeType: "image/png", buffer: png } },
  });
  expect(response.status()).toBe(403);
});

/** An RGB PNG of random pixels, which compresses about as badly as a photo. */
function noisePng(width: number, height: number): Buffer {
  const rows = Buffer.alloc((width * 3 + 1) * height);
  for (let i = 0; i < rows.length; i++) rows[i] = (i * 2654435761) >>> 24;
  for (let y = 0; y < height; y++) rows[y * (width * 3 + 1)] = 0;
  const chunk = (type: string, data: Buffer) => {
    const typed = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    typed.copy(out, 4);
    out.writeUInt32BE(crc32(typed), 8 + data.length);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows, { level: 1 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
