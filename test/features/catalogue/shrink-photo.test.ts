import { describe, expect, it } from "vitest";

import {
  fitWithin,
  MAX_PHOTO_SIDE,
  needsShrinking,
  SHRINK_ABOVE_BYTES,
  shrinkPhoto,
} from "@/features/catalogue/shrink-photo";

describe("fitWithin", () => {
  it("leaves a photo that already fits alone", () => {
    expect(fitWithin(1200, 800, 1600)).toEqual({ width: 1200, height: 800 });
    expect(fitWithin(1600, 1600, 1600)).toEqual({ width: 1600, height: 1600 });
  });

  it("scales the longest side down and keeps the shape", () => {
    expect(fitWithin(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it("never goes below one pixel", () => {
    expect(fitWithin(100_000, 10, 1600)).toEqual({ width: 1600, height: 1 });
  });
});

describe("needsShrinking", () => {
  it("skips small photos", () => {
    expect(needsShrinking(200_000, 1200, 900)).toBe(false);
    expect(needsShrinking(SHRINK_ABOVE_BYTES, MAX_PHOTO_SIDE, 900)).toBe(false);
  });

  it("shrinks heavy or oversized photos", () => {
    expect(needsShrinking(SHRINK_ABOVE_BYTES + 1, 1200, 900)).toBe(true);
    expect(needsShrinking(200_000, MAX_PHOTO_SIDE + 1, 900)).toBe(true);
  });
});

describe("shrinkPhoto", () => {
  it("uploads the original when the browser can't read the image", async () => {
    // jsdom has no createImageBitmap, like a browser that can't decode the file.
    const file = new File([new Uint8Array(10)], "tote.png", {
      type: "image/png",
    });
    expect(await shrinkPhoto(file)).toBe(file);
  });
});
