import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatCount } from "@/core/format/format";

/** "26–50 of 132" with previous and next links. */
export function PaginationBar({
  page,
  pageSize,
  totalCount,
  hrefForPage,
  noun = "results",
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  hrefForPage: (page: number) => string;
  noun?: string;
}) {
  const lastPage = Math.max(1, Math.ceil(totalCount / pageSize));
  const first = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalCount);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 pt-4"
    >
      <p className="text-sm text-muted-foreground">
        {first}–{last} of {formatCount(totalCount)} {noun}
      </p>
      <div className="flex items-center gap-2">
        <PageLink
          href={page > 1 ? hrefForPage(page - 1) : undefined}
          label="Previous page"
        >
          <ChevronLeft />
        </PageLink>
        <span className="text-sm tabular-nums">
          Page {page} of {lastPage}
        </span>
        <PageLink
          href={page < lastPage ? hrefForPage(page + 1) : undefined}
          label="Next page"
        >
          <ChevronRight />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <Button variant="outline" size="icon" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="icon" asChild>
      <Link href={href} aria-label={label} scroll={false}>
        {children}
      </Link>
    </Button>
  );
}
