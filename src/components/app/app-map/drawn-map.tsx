"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { boundsOf, type Bounds, type LatLng } from "@/core/geo";

import { coastline, colomboBounds, placeLabels } from "./colombo";
import { MapMarkerView } from "./map-marker-view";
import type { MapLine, MapMarker } from "./types";

const MAX_ZOOM = 4;

/**
 * A drawn map of Colombo for when there's no Google Maps key, the same
 * fallback rule as the collector app's AppMap. Real coordinates, simple
 * equirectangular projection, zoom buttons and follow-the-selection.
 */
export function DrawnMap({
  markers,
  lines = [],
  selectedId,
  onSelect,
}: {
  markers: MapMarker[];
  lines?: MapLine[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fit = useMemo(
    () => boundsOf(markers, 0.12) ?? colomboBounds,
    [markers],
  );
  const selected = markers.find((m) => m.id === selectedId);
  // Zoomed in, the view follows the selection; at 1× it fits everything.
  const center: LatLng =
    zoom > 1 && selected
      ? selected
      : {
          latitude: (fit.north + fit.south) / 2,
          longitude: (fit.east + fit.west) / 2,
        };
  const view = viewport(fit, center, zoom, size);
  const project = (point: LatLng) => ({
    x: ((point.longitude - view.west) / (view.east - view.west)) * size.width,
    y:
      ((view.north - point.latitude) / (view.north - view.south)) * size.height,
  });

  const sea = [
    ...coastline,
    { latitude: coastline.at(-1)!.latitude, longitude: 79.5 },
    { latitude: coastline[0]!.latitude, longitude: 79.5 },
  ]
    .map(project)
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");

  return (
    <div
      ref={ref}
      className="relative h-full min-h-80 w-full overflow-hidden bg-background"
      role="application"
      aria-label="Map of collectors and pickups"
    >
      <svg
        aria-hidden
        className="absolute inset-0"
        width={size.width}
        height={size.height}
      >
        <polygon points={sea} className="fill-cyan/15" />
        <polyline
          points={coastline
            .map(project)
            .map(({ x, y }) => `${x},${y}`)
            .join(" ")}
          className="fill-none stroke-cyan/50"
          strokeWidth={2}
        />
        {placeLabels.map((place) => {
          const { x, y } = project(place);
          return (
            <text
              key={place.name}
              x={x}
              y={y}
              textAnchor="middle"
              className="fill-muted-foreground/60 text-[11px] font-semibold tracking-wide uppercase"
            >
              {place.name}
            </text>
          );
        })}
        {lines.map((line) => {
          const from = project(line.from);
          const to = project(line.to);
          return (
            <line
              key={line.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className="stroke-primary/60"
              strokeWidth={2}
              strokeDasharray="6 5"
            />
          );
        })}
      </svg>

      {markers.map((marker) => {
        const { x, y } = project(marker);
        const isSelected = marker.id === selectedId;
        return (
          <button
            key={marker.id}
            type="button"
            title={marker.label}
            aria-label={marker.label}
            aria-pressed={isSelected}
            onClick={() => onSelect?.(marker.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring"
            style={{ left: x, top: y, zIndex: isSelected ? 20 : 10 }}
          >
            <MapMarkerView kind={marker.kind} selected={isSelected} />
          </button>
        );
      })}

      <div className="absolute top-3 right-3 z-30 flex flex-col gap-1">
        <Button
          size="icon"
          variant="outline"
          aria-label="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.6))}
        >
          <Plus />
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label="Zoom out"
          disabled={zoom <= 1}
          onClick={() => setZoom((z) => Math.max(1, z / 1.6))}
        >
          <Minus />
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label="Show everything"
          onClick={() => setZoom(1)}
        >
          <Maximize2 />
        </Button>
      </div>
      <p className="absolute right-3 bottom-3 z-30 rounded-md bg-card/90 px-2 py-1 text-[11px] text-muted-foreground">
        Drawn map · add a Google Maps key for streets
      </p>
    </div>
  );
}

/** The visible box: `fit` zoomed around `center`, stretched to the container's shape. */
function viewport(
  fit: Bounds,
  center: LatLng,
  zoom: number,
  size: { width: number; height: number },
): Bounds {
  // A degree of longitude is shorter than one of latitude here.
  const lngScale = Math.cos((center.latitude * Math.PI) / 180);
  let latSpan = (fit.north - fit.south) / zoom;
  let lngSpan = (fit.east - fit.west) / zoom;
  const contentAspect = (lngSpan * lngScale) / latSpan;
  const boxAspect = size.width / Math.max(size.height, 1);
  if (boxAspect > contentAspect) {
    lngSpan = (latSpan * boxAspect) / lngScale;
  } else {
    latSpan = (lngSpan * lngScale) / boxAspect;
  }
  return {
    north: center.latitude + latSpan / 2,
    south: center.latitude - latSpan / 2,
    east: center.longitude + lngSpan / 2,
    west: center.longitude - lngSpan / 2,
  };
}
