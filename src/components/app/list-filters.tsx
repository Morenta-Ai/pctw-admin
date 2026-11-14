"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL = "all";

export type FilterSelect = {
  /** The URL param, such as `status`. */
  param: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
  className?: string;
};

/**
 * Search box and filter selects for a list page. Everything lives in the URL,
 * so a filtered view can be bookmarked or shared, and changing a filter goes
 * back to page 1.
 */
export function ListFilters({
  searchLabel,
  searchPlaceholder,
  selects = [],
}: {
  searchLabel: string;
  searchPlaceholder: string;
  selects?: FilterSelect[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // With Cache Components a page left behind stays mounted but hidden; its
  // effects are cleaned up, so a pending search can't fire after navigation.
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === ALL) next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    const query = next.toString();
    // Nothing changed, or staff already moved on to another page.
    if (query === params.toString() || window.location.pathname !== pathname)
      return;
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  const hasFilters = ["q", ...selects.map((s) => s.param)].some((key) =>
    params.has(key),
  );

  return (
    <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center">
      <div className="relative lg:w-80">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label={searchLabel}
          placeholder={searchPlaceholder}
          defaultValue={params.get("q") ?? ""}
          className="h-9 pl-9"
          onChange={(event) => {
            const value = event.target.value;
            clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(
              () => update({ q: value.trim() }),
              300,
            );
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {selects.map((select) => (
          <Select
            key={select.param}
            value={params.get(select.param) ?? ALL}
            onValueChange={(value) => update({ [select.param]: value })}
          >
            <SelectTrigger
              aria-label={select.label}
              className={cn("h-9 w-44", select.className)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{select.allLabel}</SelectItem>
              {select.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              startTransition(() => router.replace(pathname, { scroll: false }))
            }
          >
            <X />
            Clear
          </Button>
        )}
        {pending && (
          <Loader2
            aria-label="Updating"
            className="size-4 animate-spin text-muted-foreground"
          />
        )}
      </div>
    </div>
  );
}
