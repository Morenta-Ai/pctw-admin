"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { useEffect } from "react";

import { boundsOf } from "@/core/geo";

import { colomboBounds } from "./colombo";
import { MapMarkerView } from "./map-marker-view";
import { focusOf } from "./focus";
import type { MapLine, MapMarker } from "./types";

export function GoogleMap({
  apiKey,
  mapId,
  markers,
  lines = [],
  selectedId,
  onSelect,
}: {
  apiKey: string;
  mapId?: string;
  markers: MapMarker[];
  lines?: MapLine[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const bounds = boundsOf(focusOf(markers), 0.12) ?? colomboBounds;
  const selected = markers.find((m) => m.id === selectedId);

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        className="h-full min-h-80 w-full"
        // Advanced markers need a map ID; Google's demo ID works for development.
        mapId={mapId ?? "DEMO_MAP_ID"}
        defaultBounds={{ ...bounds, padding: 40 }}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
      >
        {markers.map((marker) => (
          <AdvancedMarker
            key={marker.id}
            position={{ lat: marker.latitude, lng: marker.longitude }}
            title={marker.label}
            zIndex={marker.id === selectedId ? 20 : 10}
            onClick={() => onSelect?.(marker.id)}
          >
            <MapMarkerView
              kind={marker.kind}
              selected={marker.id === selectedId}
            />
          </AdvancedMarker>
        ))}
        <Lines lines={lines} />
        <PanTo latitude={selected?.latitude} longitude={selected?.longitude} />
      </Map>
    </APIProvider>
  );
}

/** Follows the selection, so picking from the list brings it into view. */
function PanTo({
  latitude,
  longitude,
}: {
  latitude?: number;
  longitude?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (map && latitude !== undefined && longitude !== undefined) {
      map.panTo({ lat: latitude, lng: longitude });
    }
  }, [map, latitude, longitude]);
  return null;
}

/** Dashed trip lines, drawn with the Maps API directly. */
function Lines({ lines }: { lines: MapLine[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const drawn = lines.map(
      (line) =>
        new google.maps.Polyline({
          map,
          path: [
            { lat: line.from.latitude, lng: line.from.longitude },
            { lat: line.to.latitude, lng: line.to.longitude },
          ],
          strokeOpacity: 0,
          icons: [
            {
              icon: {
                path: "M 0,-1 0,1",
                strokeOpacity: 0.7,
                strokeColor: "#1F2A5A",
                scale: 3,
              },
              offset: "0",
              repeat: "12px",
            },
          ],
        }),
    );
    return () => drawn.forEach((polyline) => polyline.setMap(null));
  }, [map, lines]);
  return null;
}
