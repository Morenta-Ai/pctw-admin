"use client";

import { useActionForm } from "@/hooks/use-action-form";

import { ImagePlus, Loader2, Plus, Save, Star, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/core/action-result";
import { errorMessage } from "@/core/api/api-error";
import { centsToRupeesInput } from "@/core/format/format";
import { saveProduct } from "@/features/catalogue/actions";
import {
  categoryLabels,
  imageTypes,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  productCategories,
  uploadSchema,
  type Product,
  type ProductCategory,
} from "@/features/catalogue/data/models";
import { cn } from "@/lib/utils";

const presetSizes: Record<ProductCategory, string[]> = {
  women: ["XS", "S", "M", "L", "XL"],
  men: ["S", "M", "L", "XL", "XXL"],
  kids: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
  accessories: ["One size"],
};

/** Create or edit a product. Photos upload as soon as they're picked. */
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [category, setCategory] = useState<ProductCategory | "">(
    product?.category ?? "",
  );
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [customSize, setCustomSize] = useState("");
  const [images, setImages] = useState<string[]>(product?.imageUrls ?? []);
  const [uploading, setUploading] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const [state, action, pending] = useActionForm<
    ActionResult<Product> | null,
    FormData
  >(async (previous, formData) => {
    const result = await saveProduct(product?.id ?? null, previous, formData);
    if (result.ok) {
      toast.success(
        product
          ? "Product saved."
          : `${result.data.name} added to the catalogue.`,
      );
      if (!product) router.push(`/catalogue/${result.data.id}`);
    }
    return result;
  }, null);
  const failed = state && !state.ok ? state : undefined;
  const fieldError = (name: string) => failed?.fieldErrors?.[name];

  const upload = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_IMAGES - images.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) toast(`Only ${MAX_IMAGES} photos per product.`);
    for (const file of picked) {
      if (!(imageTypes as readonly string[]).includes(file.type)) {
        toast.error(`${file.name}: use a JPEG, PNG or WebP photo.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name} is over 5 MB.`);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/uploads", {
          method: "POST",
          body: form,
        });
        if (!response.ok) throw new Error(String(response.status));
        const { url } = uploadSchema.parse(await response.json());
        setImages((current) => [...current, url].slice(0, MAX_IMAGES));
      } catch {
        toast.error(`${file.name} didn't upload. Try again.`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const toggleSize = (size: string) =>
    setSizes((current) =>
      current.includes(size)
        ? current.filter((s) => s !== size)
        : [...current, size],
    );

  return (
    <form onSubmit={action} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-5">
        <Field label="Name" htmlFor="name" error={fieldError("name")}>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            maxLength={80}
            aria-invalid={Boolean(fieldError("name"))}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            label="Category"
            htmlFor="category"
            error={fieldError("category")}
          >
            <Select
              name="category"
              value={category}
              onValueChange={(value) => setCategory(value as ProductCategory)}
            >
              <SelectTrigger
                id="category"
                className="w-full"
                aria-invalid={Boolean(fieldError("category"))}
              >
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent>
                {productCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoryLabels[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Price" htmlFor="price" error={fieldError("priceCents")}>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                Rs.
              </span>
              <Input
                id="price"
                name="price"
                inputMode="decimal"
                defaultValue={
                  product ? centsToRupeesInput(product.priceCents) : ""
                }
                className="pl-10 tabular-nums"
                aria-invalid={Boolean(fieldError("priceCents"))}
              />
            </div>
          </Field>
          <Field label="Stock" htmlFor="stock" error={fieldError("stock")}>
            <Input
              id="stock"
              name="stock"
              inputMode="numeric"
              defaultValue={product?.stock ?? 1}
              className="tabular-nums"
              aria-invalid={Boolean(fieldError("stock"))}
            />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Sizes</legend>
          {sizes.map((size) => (
            <input key={size} type="hidden" name="sizes" value={size} />
          ))}
          <div className="flex flex-wrap gap-2">
            {[
              ...new Set([
                ...(category ? presetSizes[category] : []),
                ...sizes,
              ]),
            ].map((size) => (
              <button
                key={size}
                type="button"
                aria-pressed={sizes.includes(size)}
                onClick={() => toggleSize(size)}
                className={cn(
                  "h-9 rounded-full border px-4 text-sm font-medium",
                  sizes.includes(size)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-muted",
                )}
              >
                {size}
              </button>
            ))}
            <div className="flex gap-1">
              <Input
                aria-label="Another size"
                placeholder="Other size"
                value={customSize}
                maxLength={12}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (customSize.trim()) toggleSize(customSize.trim());
                    setCustomSize("");
                  }
                }}
                className="h-9 w-28"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Add size"
                onClick={() => {
                  if (customSize.trim()) toggleSize(customSize.trim());
                  setCustomSize("");
                }}
              >
                <Plus />
              </Button>
            </div>
          </div>
          {fieldError("sizes") && (
            <p className="text-xs text-destructive">{fieldError("sizes")}</p>
          )}
        </fieldset>

        <Field
          label="Story"
          htmlFor="story"
          hint="Shown in the shop: where the garment came from and how it was remade."
          error={fieldError("story")}
        >
          <Textarea
            id="story"
            name="story"
            rows={4}
            maxLength={500}
            defaultValue={product?.story}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            Photos{" "}
            <span className="font-normal text-muted-foreground">
              ({images.length}/{MAX_IMAGES}, first is the cover)
            </span>
          </span>
          <input
            type="hidden"
            name="imageUrls"
            value={JSON.stringify(images)}
          />
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-lg border"
              >
                <Image
                  src={url}
                  alt={`Photo ${i + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-lime px-1.5 text-[10px] font-bold text-lime-foreground">
                    Cover
                  </span>
                )}
                <div className="absolute top-1 right-1 flex gap-1">
                  {i > 0 && (
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="secondary"
                      aria-label={`Make photo ${i + 1} the cover`}
                      onClick={() =>
                        setImages((all) => [
                          url,
                          ...all.filter((u) => u !== url),
                        ])
                      }
                    >
                      <Star />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="secondary"
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() =>
                      setImages((all) => all.filter((u) => u !== url))
                    }
                  >
                    <X />
                  </Button>
                </div>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground hover:bg-muted"
              >
                {uploading > 0 ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ImagePlus className="size-5" />
                )}
                {uploading > 0 ? "Uploading…" : "Add photos"}
              </button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept={imageTypes.join(",")}
            multiple
            hidden
            aria-label="Upload photos"
            onChange={(e) => {
              void upload(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-muted-foreground">
            JPEG, PNG or WebP, up to 5 MB each.
          </p>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
          <span className="flex flex-col">
            <span className="text-sm font-semibold">Show in the shop</span>
            <span className="text-xs text-muted-foreground">
              Customers see it while it&apos;s in stock.
            </span>
          </span>
          <Switch
            name="published"
            defaultChecked={product?.published ?? true}
          />
        </label>

        {failed && !failed.fieldErrors && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage(failed.error)}
          </p>
        )}
        {failed?.fieldErrors && (
          <p role="alert" className="text-sm text-destructive">
            Check the highlighted fields.
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending || uploading > 0}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          {product ? "Save changes" : "Add product"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {(error ?? hint) && (
        <p
          className={
            error ? "text-xs text-destructive" : "text-xs text-muted-foreground"
          }
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
