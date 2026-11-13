import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import { DEFAULT_PAGE_SIZE } from "@/core/paged";
import type { CatalogueSource } from "@/features/catalogue/data/catalogue-source";
import {
  productPageSchema,
  productSchema,
  uploadSchema,
  type ProductInput,
  type ProductQuery,
} from "@/features/catalogue/data/models";

export class CatalogueRemoteSource implements CatalogueSource {
  constructor(private readonly api: ApiClient) {}

  list(query: ProductQuery) {
    return this.api.get("/admin/products", {
      query: { ...query, pageSize: DEFAULT_PAGE_SIZE },
      schema: productPageSchema,
    });
  }

  get(id: string) {
    return this.api.get(`/admin/products/${encodeURIComponent(id)}`, {
      schema: productSchema,
    });
  }

  create(input: ProductInput) {
    return this.api.post("/admin/products", {
      body: input,
      schema: productSchema,
    });
  }

  update(id: string, input: Partial<ProductInput>) {
    return this.api.patch(`/admin/products/${encodeURIComponent(id)}`, {
      body: input,
      schema: productSchema,
    });
  }

  upload(file: File) {
    const form = new FormData();
    form.set("file", file);
    return this.api.postForm("/admin/uploads", form, uploadSchema);
  }
}
