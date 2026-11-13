import { Pencil, Shirt } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/app/empty-state";
import { PaginationBar } from "@/components/app/pagination-bar";
import { StatusPill, type PillTone } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatRelative } from "@/core/format/format";
import type { Paged } from "@/core/paged";
import type { SearchParams } from "@/core/search-params";
import { hrefWith } from "@/core/url";
import { ProductThumb } from "@/features/catalogue/components/product-thumb";
import { PublishSwitch } from "@/features/catalogue/components/publish-switch";
import {
  categoryLabels,
  productStatus,
  productStatusLabels,
  type Product,
  type ProductStatus,
} from "@/features/catalogue/data/models";

const tones: Record<ProductStatus, PillTone> = {
  published: "success",
  hidden: "neutral",
  outOfStock: "warning",
};

export function ProductsTable({
  page,
  params,
  now,
}: {
  page: Paged<Product>;
  params: SearchParams;
  now: Date;
}) {
  if (page.totalCount === 0) {
    return (
      <EmptyState
        icon={Shirt}
        title="No products match"
        action={
          <Button asChild>
            <Link href="/catalogue/new">Add a product</Link>
          </Button>
        }
      >
        Try another filter, or add today&apos;s garments.
      </EmptyState>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>In shop</TableHead>
            <TableHead className="text-right">Added</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.items.map((product) => {
            const status = productStatus(product);
            return (
              <TableRow key={product.id}>
                <TableCell>
                  <Link
                    href={`/catalogue/${product.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <ProductThumb
                      url={product.imageUrls[0]}
                      name={product.name}
                    />
                    <span className="flex flex-col">
                      <span className="font-semibold">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.sizes.join(" · ")}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell>{categoryLabels[product.category]}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatMoney(product.priceCents)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {product.stock}
                </TableCell>
                <TableCell>
                  <StatusPill tone={tones[status]}>
                    {productStatusLabels[status]}
                  </StatusPill>
                </TableCell>
                <TableCell>
                  <PublishSwitch
                    productId={product.id}
                    name={product.name}
                    published={product.published}
                  />
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatRelative(product.createdAt, now)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      href={`/catalogue/${product.id}`}
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <PaginationBar
        page={page.page}
        pageSize={page.pageSize}
        totalCount={page.totalCount}
        noun="products"
        hrefForPage={(n) =>
          hrefWith("/catalogue", params, { page: n === 1 ? null : n })
        }
      />
    </>
  );
}
