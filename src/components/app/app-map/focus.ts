import type { MapMarker } from "./types";

/**
 * The markers the first view should fit: people and pickups, not hubs,
 * which sit at the edges of the city and would shrink everything else.
 */
export function focusOf(markers: MapMarker[]): MapMarker[] {
  const focus = markers.filter((marker) => marker.kind !== "hub");
  return focus.length > 0 ? focus : markers;
}
