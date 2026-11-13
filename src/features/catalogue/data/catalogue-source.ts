import type { Paged } from "@/core/paged";
import type {
  Product,
  ProductInput,
  ProductQuery,
  Upload,
} from "@/features/catalogue/data/models";

/** Talks to `/admin/products` and `/admin/uploads`. Throws ApiError on failure. */
export type CatalogueSource = {
  list(query: ProductQuery): Promise<Paged<Product>>;
  get(id: string): Promise<Product>;
  create(input: ProductInput): Promise<Product>;
  update(id: string, input: Partial<ProductInput>): Promise<Product>;
  upload(file: File): Promise<Upload>;
};
