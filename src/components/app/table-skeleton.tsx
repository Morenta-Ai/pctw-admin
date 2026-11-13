import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder rows while a table's data streams in. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy aria-label="Loading">
      <Skeleton className="h-10" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  );
}
