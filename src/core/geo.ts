export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;
const toRad = (degrees: number) => (degrees * Math.PI) / 180;

/** Straight-line distance in km (haversine), rounded to 1 decimal like the API's `…Km` fields. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLng / 2) ** 2;
  const km = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  return Math.round(km * 10) / 10;
}

export type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/** The box around some points, grown by `padding` (a fraction of its size). */
export function boundsOf(points: LatLng[], padding = 0.1): Bounds | null {
  if (points.length === 0) return null;
  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;
  for (const { latitude, longitude } of points) {
    north = Math.max(north, latitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    west = Math.min(west, longitude);
  }
  // Keep a minimum size so a single point isn't a zero-area box.
  const latPad = Math.max((north - south) * padding, 0.005);
  const lngPad = Math.max((east - west) * padding, 0.005);
  return {
    north: north + latPad,
    south: south - latPad,
    east: east + lngPad,
    west: west - lngPad,
  };
}
