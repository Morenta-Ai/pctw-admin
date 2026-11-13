import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** A headline number with a label and a supporting line. The apps' StatCard. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  /** Makes the whole card a link to the detail. */
  href?: string;
  /** Navy card with lime icon, for the one figure that matters most. */
  highlight?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "text-sm font-medium",
            highlight
              ? "text-sidebar-muted-foreground"
              : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            highlight
              ? "bg-lime text-lime-foreground"
              : "bg-secondary text-primary",
          )}
        >
          <Icon className="size-4.5" />
        </span>
      </div>
      <span className="font-heading text-3xl font-bold tracking-tight">
        {value}
      </span>
      {hint && (
        <span
          className={cn(
            "text-xs",
            highlight
              ? "text-sidebar-muted-foreground"
              : "text-muted-foreground",
          )}
        >
          {hint}
        </span>
      )}
    </>
  );

  const className = cn(
    "flex flex-col gap-2 rounded-xl border p-5 transition-colors",
    highlight ? "border-primary bg-primary text-primary-foreground" : "bg-card",
    href &&
      "outline-none hover:border-ring/40 focus-visible:ring-3 focus-visible:ring-ring/50",
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
