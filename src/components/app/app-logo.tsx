import { cn } from "@/lib/utils";

/** The lime "R" tile on its own, matching the apps' logo mark. */
export function AppLogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-lime text-lime-foreground font-heading inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-xl font-extrabold",
        className,
      )}
    >
      R
    </span>
  );
}

/** Lime "R" tile, then "ReThread" over the product label. Drawn for navy. */
export function AppLogo({
  label = "Admin",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <AppLogoMark />
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-lg font-bold text-white">
          ReThread
        </span>
        <span className="text-lime text-[11px] font-bold tracking-[0.15em] uppercase">
          {label}
        </span>
      </span>
    </span>
  );
}
