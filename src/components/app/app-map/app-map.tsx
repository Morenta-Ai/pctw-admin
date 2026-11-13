"use client";

import { DrawnMap } from "./drawn-map";
import { GoogleMap } from "./google-map";
import type { MapLine, MapMarker } from "./types";

export type { MapLine, MapMarker } from "./types";

/**
 * The portal's map. Real Google Maps with a key, otherwise a drawn map of
 * Colombo, so the portal and CI work without one. Use this, never
 * GoogleMap or DrawnMap directly.
 */
export function AppMap(props: {
  apiKey?: string;
  mapId?: string;
  markers: MapMarker[];
  lines?: MapLine[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const { apiKey, ...rest } = props;
  return apiKey ? (
    <GoogleMap apiKey={apiKey} {...rest} />
  ) : (
    <DrawnMap {...rest} />
  );
}
