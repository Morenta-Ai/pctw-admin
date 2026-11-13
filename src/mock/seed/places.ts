import type { Area, MockHub } from "@/mock/types";

/** Colombo-area suburbs the apps' mock data uses, with real coordinates. */
export const areas: Area[] = [
  { name: "Dehiwala", latitude: 6.8511, longitude: 79.8655 },
  { name: "Wellawatte", latitude: 6.8742, longitude: 79.8606 },
  { name: "Bambalapitiya", latitude: 6.8935, longitude: 79.8553 },
  { name: "Kollupitiya", latitude: 6.91, longitude: 79.85 },
  { name: "Nugegoda", latitude: 6.8649, longitude: 79.8997 },
  { name: "Rajagiriya", latitude: 6.9094, longitude: 79.894 },
  { name: "Battaramulla", latitude: 6.899, longitude: 79.918 },
  { name: "Mount Lavinia", latitude: 6.839, longitude: 79.865 },
  { name: "Kotte", latitude: 6.8868, longitude: 79.9187 },
  { name: "Borella", latitude: 6.9147, longitude: 79.8778 },
  { name: "Maharagama", latitude: 6.848, longitude: 79.926 },
  { name: "Wattala", latitude: 6.989, longitude: 79.892 },
];

export const streets = [
  "Galle Road",
  "Hill Street",
  "Duplication Road",
  "High Level Road",
  "Station Road",
  "Temple Road",
  "Park Avenue",
  "Lake Drive",
  "Flower Road",
  "Baseline Road",
];

export const seedHubs = (): MockHub[] => [
  {
    id: "hub_plg",
    code: "PLG",
    name: "Central Hub — Peliyagoda",
    closesAt: "18:00",
    latitude: 6.9622,
    longitude: 79.8829,
  },
  {
    id: "hub_mrt",
    code: "MRT",
    name: "South Hub — Moratuwa",
    closesAt: "17:30",
    latitude: 6.7733,
    longitude: 79.8826,
  },
];
