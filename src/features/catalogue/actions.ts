"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import {
  actionError,
  actionInvalid,
  actionOk,
  type ActionResult,
} from "@/core/action-result";
import { requireRole } from "@/core/auth/session";
import { rupeesToCents } from "@/core/format/format";
import { getCatalogueRepository } from "@/features/catalogue/data/catalogue-repository";
import {
  productInputSchema,
  type Product,
} from "@/features/catalogue/data/models";

/** Creates a product, or updates `productId` when given. */
export async function saveProduct(
  productId: string | null,
  _previous: ActionResult<Product> | null,
  formData: FormData,
): Promise<ActionResult<Product>> {
  await requireRole("admin");

  const priceCents = rupeesToCents(String(formData.get("price") ?? ""));
  const stockText = String(formData.get("stock") ?? "").trim();
  let imageUrls: unknown = [];
  try {
    imageUrls = JSON.parse(String(formData.get("imageUrls") ?? "[]"));
  } catch {
    imageUrls = [];
  }

  const parsed = productInputSchema.safeParse({
    name: formData.get("name") ?? "",
    category: formData.get("category") || undefined,
    priceCents: priceCents ?? Number.NaN,
    sizes: formData.getAll("sizes").map(String),
    stock: /^\d+$/.test(stockText) ? Number(stockText) : Number.NaN,
    published: formData.get("published") === "on",
    story: formData.get("story") ?? "",
    imageUrls,
  });
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    const errors: Record<string, string> = {};
    for (const [key, messages] of Object.entries(fields)) {
      if (messages?.[0]) errors[key] = messages[0];
    }
    if (priceCents === null) errors.priceCents = "Enter a price like 2450.00.";
    if (!/^\d+$/.test(stockText))
      errors.stock = "Stock is a whole number, like 6.";
    return actionInvalid(errors);
  }

  const repo = getCatalogueRepository();
  const result = productId
    ? await repo.update(productId, parsed.data)
    : await repo.create(parsed.data);
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}

export async function setPublished(
  productId: string,
  published: boolean,
): Promise<ActionResult<Product>> {
  await requireRole("admin");
  const result = await getCatalogueRepository().update(productId, {
    published,
  });
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}
