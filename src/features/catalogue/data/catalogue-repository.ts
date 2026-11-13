import "server-only";

import { getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import type { Paged } from "@/core/paged";
import { guard, type Result } from "@/core/result";
import { CatalogueMockSource } from "@/features/catalogue/data/catalogue-mock-source";
import { CatalogueRemoteSource } from "@/features/catalogue/data/catalogue-remote-source";
import type { CatalogueSource } from "@/features/catalogue/data/catalogue-source";
import type {
  Product,
  ProductInput,
  ProductQuery,
  Upload,
} from "@/features/catalogue/data/models";
import { getMockWorld } from "@/mock/mock-world";

export type CatalogueRepository = {
  list(query: ProductQuery): Promise<Result<Paged<Product>>>;
  get(id: string): Promise<Result<Product>>;
  create(input: ProductInput): Promise<Result<Product>>;
  update(id: string, input: Partial<ProductInput>): Promise<Result<Product>>;
  upload(file: File): Promise<Result<Upload>>;
};

export function createCatalogueRepository(
  source: CatalogueSource,
): CatalogueRepository {
  return {
    list: (query) => guard(() => source.list(query)),
    get: (id) => guard(() => source.get(id)),
    create: (input) => guard(() => source.create(input)),
    update: (id, input) => guard(() => source.update(id, input)),
    upload: (file) => guard(() => source.upload(file)),
  };
}

export function getCatalogueRepository(): CatalogueRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new CatalogueMockSource(getMockWorld())
    : new CatalogueRemoteSource(getApiClient());
  return createCatalogueRepository(source);
}
