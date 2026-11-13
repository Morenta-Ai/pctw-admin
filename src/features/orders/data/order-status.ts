import type { PillTone } from "@/components/app/status-pill";

export const orderStatuses = [
  "placed",
  "confirmed",
  "outForDelivery",
  "readyAtVendor",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const fulfilmentTypes = ["homeDelivery", "clickAndCollect"] as const;
export type FulfilmentType = (typeof fulfilmentTypes)[number];

export const orderStatusLabels: Record<OrderStatus, string> = {
  placed: "New",
  confirmed: "Confirmed",
  outForDelivery: "Out for delivery",
  readyAtVendor: "Ready at vendor",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const orderStatusTones: Record<OrderStatus, PillTone> = {
  placed: "warning",
  confirmed: "info",
  outForDelivery: "cyan",
  readyAtVendor: "cyan",
  completed: "success",
  cancelled: "danger",
};

export const fulfilmentLabels: Record<FulfilmentType, string> = {
  homeDelivery: "Home delivery",
  clickAndCollect: "Click & collect",
};

/** Where an order can go next (docs/API_CONTRACT.md, Orders). */
export function nextStatuses(
  status: OrderStatus,
  fulfilment: FulfilmentType,
): OrderStatus[] {
  switch (status) {
    case "placed":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return [
        fulfilment === "homeDelivery" ? "outForDelivery" : "readyAtVendor",
        "cancelled",
      ];
    case "outForDelivery":
    case "readyAtVendor":
      return ["completed", "cancelled"];
    default:
      return [];
  }
}
