import { Package, Truck, Warehouse } from "lucide-react";

import { cn } from "@/lib/utils";

import type { MarkerKind } from "./types";

const styles: Record<MarkerKind, string> = {
  collector: "bg-primary text-lime border-lime rounded-full",
  collectorOffline:
    "bg-muted-foreground/70 text-white border-white rounded-full",
  pending: "bg-warning-bg text-warning border-warning rounded-lg",
  pendingUrgent: "bg-destructive text-white border-white rounded-lg",
  assignedPickup: "bg-cyan text-white border-white rounded-lg",
  hub: "bg-primary text-white border-white rounded-md",
};

/** One marker's look, shared by the Google map and the drawn map. */
export function MapMarkerView({
  kind,
  selected,
}: {
  kind: MarkerKind;
  selected: boolean;
}) {
  const Icon =
    kind === "hub" ? Warehouse : kind.startsWith("collector") ? Truck : Package;
  return (
    <span
      className={cn(
        "relative flex size-8 items-center justify-center border-2 shadow-md transition-transform",
        styles[kind],
        selected &&
          "scale-125 ring-3 ring-ring ring-offset-2 ring-offset-background",
      )}
    >
      <Icon className="size-4" />
      {kind === "pendingUrgent" && (
        <span className="absolute inset-0 -z-10 animate-ping rounded-lg bg-destructive opacity-60" />
      )}
    </span>
  );
}
