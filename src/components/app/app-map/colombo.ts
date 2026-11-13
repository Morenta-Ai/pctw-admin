import type { LatLng } from "@/core/geo";

/*
 * Just enough real geography for the drawn map to read as Colombo: the
 * coastline from Wattala to Moratuwa and some place names. Approximate.
 */
export const coastline: LatLng[] = [
  { latitude: 7.06, longitude: 79.858 },
  { latitude: 7.0, longitude: 79.862 },
  { latitude: 6.975, longitude: 79.862 },
  { latitude: 6.955, longitude: 79.852 },
  { latitude: 6.942, longitude: 79.842 },
  { latitude: 6.93, longitude: 79.843 },
  { latitude: 6.915, longitude: 79.848 },
  { latitude: 6.895, longitude: 79.853 },
  { latitude: 6.875, longitude: 79.857 },
  { latitude: 6.855, longitude: 79.861 },
  { latitude: 6.835, longitude: 79.862 },
  { latitude: 6.81, longitude: 79.867 },
  { latitude: 6.785, longitude: 79.873 },
  { latitude: 6.76, longitude: 79.88 },
  { latitude: 6.72, longitude: 79.892 },
];

export const placeLabels: (LatLng & { name: string })[] = [
  { name: "Fort", latitude: 6.9344, longitude: 79.8478 },
  { name: "Kollupitiya", latitude: 6.9105, longitude: 79.8525 },
  { name: "Bambalapitiya", latitude: 6.8935, longitude: 79.8565 },
  { name: "Wellawatte", latitude: 6.8742, longitude: 79.862 },
  { name: "Dehiwala", latitude: 6.8511, longitude: 79.867 },
  { name: "Mount Lavinia", latitude: 6.832, longitude: 79.87 },
  { name: "Borella", latitude: 6.9147, longitude: 79.8778 },
  { name: "Nugegoda", latitude: 6.8649, longitude: 79.8997 },
  { name: "Rajagiriya", latitude: 6.9094, longitude: 79.894 },
  { name: "Kotte", latitude: 6.8868, longitude: 79.9187 },
  { name: "Battaramulla", latitude: 6.899, longitude: 79.93 },
  { name: "Maharagama", latitude: 6.848, longitude: 79.926 },
  { name: "Peliyagoda", latitude: 6.9622, longitude: 79.8829 },
  { name: "Wattala", latitude: 6.989, longitude: 79.892 },
  { name: "Moratuwa", latitude: 6.7733, longitude: 79.8826 },
];

/** What the drawn map shows when there's nothing to fit. */
export const colomboBounds = {
  north: 6.99,
  south: 6.82,
  east: 79.94,
  west: 79.83,
};
