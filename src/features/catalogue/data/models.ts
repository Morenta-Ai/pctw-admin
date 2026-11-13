import { z } from "zod";

import { pagedSchema } from "@/core/paged";

export const productCategories = [
  "women",
  "men",
  "kids",
  "accessories",
] as const;
export type ProductCategory = (typeof productCategories)[number];

export const categoryLabels: Record<ProductCategory, string> = {
  women: "Women",
  men: "Men",
  kids: "Kids",
  accessories: "Accessories",
};

export const productStatuses = ["published", "hidden", "outOfStock"] as const;
export type ProductStatus = (typeof productStatuses)[number];

export const productStatusLabels: Record<ProductStatus, string> = {
  published: "In the shop",
  hidden: "Hidden",
  outOfStock: "Out of stock",
};

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const imageTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(productCategories),
  priceCents: z.number().int().positive(),
  sizes: z.array(z.string()).min(1),
  stock: z.number().int().nonnegative(),
  published: z.boolean(),
  story: z.string(),
  imageUrls: z.array(z.string()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Product = z.infer<typeof productSchema>;

export const productPageSchema = pagedSchema(productSchema);

/** `POST /admin/products`; `PATCH` takes any subset. */
export const productInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give the product a name.")
    .max(80, "Keep the name under 80 characters."),
  category: z.enum(productCategories, "Choose a category."),
  priceCents: z.number().int().positive("Enter a price above zero."),
  sizes: z
    .array(z.string().trim().min(1).max(12))
    .min(1, "Add at least one size."),
  stock: z
    .number()
    .int("Stock is a whole number.")
    .nonnegative("Stock can't be negative."),
  published: z.boolean(),
  story: z.string().trim().max(500, "Keep the story under 500 characters."),
  imageUrls: z.array(z.string()).max(MAX_IMAGES, `Up to ${MAX_IMAGES} photos.`),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const productQuerySchema = z.object({
  category: z.enum(productCategories).optional().catch(undefined),
  status: z.enum(productStatuses).optional().catch(undefined),
  uploadedOn: z.iso.date().optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const uploadSchema = z.object({ id: z.string(), url: z.string() });
export type Upload = z.infer<typeof uploadSchema>;

/** Where a product stands in the shop. */
export function productStatus(
  product: Pick<Product, "published" | "stock">,
): ProductStatus {
  if (!product.published) return "hidden";
  return product.stock === 0 ? "outOfStock" : "published";
}
