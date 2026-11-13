"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  pickupSourceLabels,
  pickupSources,
  pickupStatuses,
  pickupStatusLabels,
} from "@/features/pickups/data/pickup-status";

const ALL = "all";

/** Search and filters. They live in the URL, so a filtered view can be shared. */
export function PickupFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === ALL) next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    const query = next.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  const date = params.get("date") ?? "";
  const datePreset =
    date === "today" || date === "yesterday" ? date : date ? "custom" : ALL;
  const hasFilters = ["q", "status", "source", "date"].some((key) =>
    params.has(key),
  );

  return (
    <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center">
      <div className="relative lg:w-80">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search pickups"
          placeholder="Pickup ID, customer, area or COL- code"
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
        <Select
          value={params.get("status") ?? ALL}
          onValueChange={(value) => update({ status: value })}
        >
          <SelectTrigger aria-label="Status" className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {pickupStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {pickupStatusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={datePreset}
          onValueChange={(value) =>
            update({ date: value === "custom" ? undefined : value })
          }
        >
          <SelectTrigger aria-label="Scheduled date" className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any date</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            {datePreset === "custom" && (
              <SelectItem value="custom">{date}</SelectItem>
            )}
          </SelectContent>
        </Select>

        <Input
          type="date"
          aria-label="Pick a date"
          className="h-9 w-40"
          value={datePreset === "custom" ? date : ""}
          onChange={(event) => update({ date: event.target.value })}
        />

        <Select
          value={params.get("source") ?? ALL}
          onValueChange={(value) => update({ source: value })}
        >
          <SelectTrigger aria-label="Booked through" className="h-9 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>App and call centre</SelectItem>
            {pickupSources.map((source) => (
              <SelectItem key={source} value={source}>
                {pickupSourceLabels[source]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              startTransition(() =>
                router.replace(pathname, { scroll: false }),
              );
            }}
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
