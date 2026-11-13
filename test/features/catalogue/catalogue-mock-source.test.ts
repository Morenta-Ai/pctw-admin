import { beforeEach, describe, expect, it } from "vitest";

import { CatalogueMockSource } from "@/features/catalogue/data/catalogue-mock-source";
import {
  createCatalogueRepository,
  type CatalogueRepository,
} from "@/features/catalogue/data/catalogue-repository";
import { productStatus } from "@/features/catalogue/data/models";
import { resetMockWorld, type MockWorld } from "@/mock/mock-world";

const now = new Date("2026-11-07T06:00:00Z");
let world: MockWorld;
let repo: CatalogueRepository;

beforeEach(() => {
  world = resetMockWorld(now);
  repo = createCatalogueRepository(new CatalogueMockSource(world, () => now));
});

const input = {
  name: "Sarong Tote",
  category: "accessories" as const,
  priceCents: 85_000,
  sizes: ["One size"],
  stock: 12,
  published: true,
  story: "Two sarongs, one bag.",
  imageUrls: [],
};

describe("productStatus", () => {
  it("is hidden, out of stock or in the shop", () => {
    expect(productStatus({ published: false, stock: 4 })).toBe("hidden");
    expect(productStatus({ published: true, stock: 0 })).toBe("outOfStock");
    expect(productStatus({ published: true, stock: 4 })).toBe("published");
  });
});

describe("catalogue mock source", () => {
  it("filters today's uploads, by status and by search", async () => {
    const today = await repo.list({ uploadedOn: "2026-11-07" });
    expect(today.ok && today.data.items.map((p) => p.id)).toEqual([
      "prd_1",
      "prd_2",
    ]);

    const hidden = await repo.list({ status: "hidden" });
    expect(hidden.ok && hidden.data.items.map((p) => p.name)).toEqual([
      "Oversized Flannel Shirt",
    ]);

    // Name or story: the jacket, dungarees, tote and bucket hat.
    const denim = await repo.list({ q: "denim" });
    expect(denim.ok && denim.data.totalCount).toBe(4);
  });

  it("creates a product as today's newest", async () => {
    const created = await repo.create(input);
    const list = await repo.list({ uploadedOn: "2026-11-07" });

    expect(created).toMatchObject({ ok: true, data: { name: "Sarong Tote" } });
    expect(list.ok && list.data.items[0]?.name).toBe("Sarong Tote");
  });

  it("updates part of a product", async () => {
    const result = await repo.update("prd_9", { published: true, stock: 3 });

    expect(result).toMatchObject({
      ok: true,
      data: { published: true, stock: 3, updatedAt: now.toISOString() },
    });
  });

  it("stores an uploaded photo and refuses other files", async () => {
    const photo = new File([new Uint8Array([1, 2, 3])], "a.png", {
      type: "image/png",
    });
    const result = await repo.upload(photo);

    expect(result).toMatchObject({
      ok: true,
      data: { url: expect.stringMatching(/^\/api\/uploads\//) },
    });
    expect(world.uploads.size).toBe(1);

    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    expect(await repo.upload(pdf)).toMatchObject({
      ok: false,
      error: { code: "UNSUPPORTED_FILE_TYPE", status: 415 },
    });
  });
});
