/*
 * The mock server's own records. They hold more than any one API response
 * (a pickup knows its customer, collector, payouts and full timeline), and
 * each mock source maps them to the contract's shapes.
 */

export type PickupStatus =
  | "pending"
  | "assigned"
  | "enRoute"
  | "arrived"
  | "collected"
  | "deliveredToHub"
  | "cancelled";

export type Slot = "morning" | "afternoon" | "evening";
export type VehicleType = "threeWheeler" | "motorbike" | "van" | "lorry";

export type Area = {
  name: string;
  latitude: number;
  longitude: number;
};

export type MockCollector = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  mobile: string;
  status: "active" | "suspended";
  online: boolean;
  latitude: number;
  longitude: number;
  lastSeenAt: string;
  area: string;
  hubId: string;
  vehicle: { type: VehicleType; plate: string; capacityKg: number };
  rating: number;
  memberSince: string;
};

export type MockCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string | null;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  joinedAt: string;
  status: "active" | "suspended";
  familyMemberCount: number;
};

export type MockPickupEvent = {
  status: PickupStatus;
  occurredAt: string;
  /** Staff or collector name for call-centre actions, null for the system. */
  actor: string | null;
};

export type MockPickupItem = {
  name: string;
  quantity: number | null;
  size: string | null;
  condition: "good" | "fair" | "worn";
};

export type MockPickup = {
  id: string;
  customerId: string;
  collectorId: string | null;
  status: PickupStatus;
  source: "app" | "callCentre";
  method: "bulk" | "itemised";
  estimatedKg: number;
  itemCount: number | null;
  bagCount: number;
  actualWeightKg: number | null;
  scheduledDate: string;
  slot: Slot;
  windowStart: string;
  windowEnd: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  note: string | null;
  items: MockPickupItem[];
  customerRatePerKgCents: number;
  collectorRatePerKgCents: number;
  customerPayoutCents: number | null;
  collectorPayoutCents: number | null;
  hubId: string | null;
  cancelReason: string | null;
  createdAt: string;
  timeline: MockPickupEvent[];
};

export type MockHub = {
  id: string;
  code: string;
  name: string;
  closesAt: string;
  latitude: number;
  longitude: number;
};

export type MockProduct = {
  id: string;
  name: string;
  category: "women" | "men" | "kids" | "accessories";
  sizes: string[];
  priceCents: number;
  stock: number;
  published: boolean;
  imageUrl: string | null;
  story: string;
  createdAt: string;
};

/** The user app's order statuses (pctw-user API_CONTRACT). */
export type OrderStatus =
  | "placed"
  | "confirmed"
  | "outForDelivery"
  | "readyAtVendor"
  | "completed"
  | "cancelled";

export type MockVendor = { id: string; name: string; address: string };

export type MockOrder = {
  id: string;
  customerId: string;
  items: {
    productId: string;
    name: string;
    size: string;
    quantity: number;
    unitPriceCents: number;
  }[];
  fulfilmentType: "homeDelivery" | "clickAndCollect";
  /** The customer's address, or the vendor's for click & collect. */
  destination: string;
  vendorId: string | null;
  paymentMethod: "card" | "wallet";
  subtotalCents: number;
  transportChargeCents: number;
  totalCents: number;
  status: OrderStatus;
  waybillNumber: string | null;
  createdAt: string;
  timeline: { status: OrderStatus; occurredAt: string; actor: string | null }[];
};

export type MockRates = {
  customerRatePerKgCents: number;
  collectorRatePerKgCents: number;
  homeDeliveryChargeCents: number;
  clickAndCollectChargeCents: number;
};
