import type { PillTone } from "@/components/app/status-pill";

/** Pickup statuses, as the API sends them. */
export const pickupStatuses = [
  "pending",
  "assigned",
  "enRoute",
  "arrived",
  "collected",
  "deliveredToHub",
  "cancelled",
] as const;
export type PickupStatus = (typeof pickupStatuses)[number];

/** A pickup can be cancelled until it's weighed. */
export const cancellableStatuses: readonly PickupStatus[] = [
  "pending",
  "assigned",
  "enRoute",
  "arrived",
];

export const pickupSources = ["app", "callCentre"] as const;
export type PickupSource = (typeof pickupSources)[number];

export const pickupSourceLabels: Record<PickupSource, string> = {
  app: "App",
  callCentre: "Call centre",
};

export const pickupStatusLabels: Record<PickupStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  enRoute: "On the way",
  arrived: "Arrived",
  collected: "Collected",
  deliveredToHub: "At hub",
  cancelled: "Cancelled",
};

export const pickupStatusTones: Record<PickupStatus, PillTone> = {
  pending: "warning",
  assigned: "info",
  enRoute: "cyan",
  arrived: "cyan",
  collected: "lime",
  deliveredToHub: "navy",
  cancelled: "danger",
};
