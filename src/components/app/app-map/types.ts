import type { LatLng } from "@/core/geo";

export type MarkerKind =
  | "collector"
  | "collectorOffline"
  | "pending"
  | "pendingUrgent"
  | "assignedPickup"
  | "hub";

export type MapMarker = LatLng & {
  id: string;
  kind: MarkerKind;
  /** Accessible name, and the tooltip. */
  label: string;
};

/** A dashed line, such as a collector's trip to their pickup. */
export type MapLine = { id: string; from: LatLng; to: LatLng };
