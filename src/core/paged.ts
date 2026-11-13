import { z } from "zod";

/** The contract's paged list: `{ items, page, pageSize, totalCount }`. */
export function pagedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalCount: z.number().int().nonnegative(),
  });
}

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export const DEFAULT_PAGE_SIZE = 25;

/** Slices an in-memory list the way the API pages it. For mock sources. */
export function paginate<T>(
  items: T[],
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Paged<T> {
  const size = Math.min(Math.max(pageSize, 1), 100);
  const lastPage = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(page, 1), lastPage);
  return {
    items: items.slice((current - 1) * size, current * size),
    page: current,
    pageSize: size,
    totalCount: items.length,
  };
}
