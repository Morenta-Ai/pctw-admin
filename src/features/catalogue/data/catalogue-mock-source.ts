import "server-only";

import { ApiError } from "@/core/api/api-error";
import { paginate } from "@/core/paged";
import { colomboDateKey } from "@/core/time";
import type { CatalogueSource } from "@/features/catalogue/data/catalogue-source";
import {
  imageTypes,
  MAX_IMAGE_BYTES,
  productStatus,
  type Product,
  type ProductInput,
  type ProductQuery,
  type Upload,
} from "@/features/catalogue/data/models";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import type { MockProduct } from "@/mock/types";

export class CatalogueMockSource implements CatalogueSource {
  constructor(
    private readonly world: MockWorld,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(query: ProductQuery) {
    await mockLatency();
    const q = query.q?.toLowerCase();
    const rows = this.world.products
      .filter((p) => !query.category || p.category === query.category)
      .filter((p) => !query.status || productStatus(p) === query.status)
      .filter(
        (p) =>
          !query.uploadedOn || colomboDateKey(p.createdAt) === query.uploadedOn,
      )
      .filter(
        (p) => !q || `${p.id} ${p.name} ${p.story}`.toLowerCase().includes(q),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return paginate(rows.map(toProduct), query.page);
  }

  async get(id: string) {
    await mockLatency();
    return toProduct(this.find(id));
  }

  async create(input: ProductInput) {
    await mockLatency(300);
    const now = this.now().toISOString();
    const product: MockProduct = {
      ...input,
      id: this.world.nextId("prd"),
      createdAt: now,
      updatedAt: now,
    };
    this.world.products.push(product);
    return toProduct(product);
  }

  async update(id: string, input: Partial<ProductInput>) {
    await mockLatency(300);
    const product = this.find(id);
    Object.assign(product, input, { updatedAt: this.now().toISOString() });
    return toProduct(product);
  }

  async upload(file: File): Promise<Upload> {
    await mockLatency(200);
    if (!(imageTypes as readonly string[]).includes(file.type)) {
      throw new ApiError({
        code: "UNSUPPORTED_FILE_TYPE",
        message: "Use a JPEG, PNG or WebP photo.",
        status: 415,
      });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new ApiError({
        code: "FILE_TOO_LARGE",
        message: "Photos can be up to 5 MB.",
        status: 413,
      });
    }
    const id = this.world.nextId("img");
    this.world.uploads.set(id, {
      id,
      contentType: file.type,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    // Served back by the mock-only route src/app/api/uploads/[id].
    return { id, url: `/api/uploads/${id}` };
  }

  private find(id: string): MockProduct {
    const product = this.world.products.find((p) => p.id === id);
    if (!product) {
      throw new ApiError({
        code: "PRODUCT_NOT_FOUND",
        message: `No product ${id}.`,
        status: 404,
      });
    }
    return product;
  }
}

const toProduct = (product: MockProduct): Product => ({
  ...product,
  sizes: [...product.sizes],
});
