import type { MapLine, MapMarker } from "@/components/app/app-map/app-map";
import { distanceKm } from "@/core/geo";
import type {
  Dispatch,
  DispatchCollector,
  DispatchPickup,
} from "@/features/dispatch/data/models";

/** Pending this long without a collector, a pickup turns urgent. */
export const URGENT_AFTER_MS = 30 * 60_000;

export const markerId = {
  pickup: (id: string) => `p:${id}`,
  collector: (id: string) => `c:${id}`,
  hub: (id: string) => `h:${id}`,
};

export function isUrgent(pickup: DispatchPickup, now: Date): boolean {
  return (
    pickup.status === "pending" &&
    now.getTime() - Date.parse(pickup.createdAt) > URGENT_AFTER_MS
  );
}

/** Markers and trip lines for the map. */
export function mapLayers(
  dispatch: Dispatch,
  { showOffline, now }: { showOffline: boolean; now: Date },
): { markers: MapMarker[]; lines: MapLine[] } {
  const markers: MapMarker[] = [];
  const lines: MapLine[] = [];

  for (const hub of dispatch.hubs) {
    markers.push({
      ...hub,
      id: markerId.hub(hub.id),
      kind: "hub",
      label: hub.name,
    });
  }
  for (const pickup of dispatch.pickups) {
    markers.push({
      id: markerId.pickup(pickup.id),
      latitude: pickup.latitude,
      longitude: pickup.longitude,
      kind:
        pickup.status !== "pending"
          ? "assignedPickup"
          : isUrgent(pickup, now)
            ? "pendingUrgent"
            : "pending",
      label: `${pickup.id}, ${pickup.area}`,
    });
  }
  for (const collector of dispatch.collectors) {
    if (!collector.online && !showOffline) continue;
    markers.push({
      id: markerId.collector(collector.id),
      latitude: collector.latitude,
      longitude: collector.longitude,
      kind: collector.online ? "collector" : "collectorOffline",
      label: `${collector.name}, ${collector.code}${collector.online ? "" : " (offline)"}`,
    });
    const pickup = dispatch.pickups.find(
      (p) => p.id === collector.activePickupId,
    );
    if (collector.online && pickup) {
      lines.push({
        id: `${collector.id}-${pickup.id}`,
        from: collector,
        to: pickup,
      });
    }
  }
  return { markers, lines };
}

export type NearbyCollector = DispatchCollector & { distanceKm: number };

/** Online collectors with room for the pickup, nearest first. */
export function nearestCollectors(
  dispatch: Dispatch,
  pickup: DispatchPickup,
  limit = 3,
): NearbyCollector[] {
  return dispatch.collectors
    .filter(
      (c) => c.online && c.vehicle.capacityKg - c.loadKg >= pickup.estimatedKg,
    )
    .map((c) => ({ ...c, distanceKm: distanceKm(c, pickup) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
