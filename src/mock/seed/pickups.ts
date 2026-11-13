import { addDays, colomboDateKey, colomboInstant } from "@/core/time";
import type { Random } from "@/mock/seed/random";
import type {
  MockCollector,
  MockCustomer,
  MockPickup,
  MockPickupEvent,
  MockPickupItem,
  MockRates,
  PickupStatus,
  Slot,
} from "@/mock/types";

const MINUTE = 60_000;

/** Order the statuses happen in, for building timelines. */
const flow: PickupStatus[] = [
  "pending",
  "assigned",
  "enRoute",
  "arrived",
  "collected",
  "deliveredToHub",
];

type Draft = {
  id: string;
  customer: MockCustomer;
  collector: MockCollector | null;
  status: PickupStatus;
  source: MockPickup["source"];
  method: MockPickup["method"];
  estimatedKg: number;
  itemCount: number | null;
  bagCount: number;
  actualWeightKg: number | null;
  date: string;
  startHour: number;
  createdAt: Date;
  /** When each status after `pending` happened, in flow order. */
  stepTimes: Date[];
  note?: string | null;
  cancelReason?: string;
};

const slotFor = (hour: number): Slot =>
  hour < 12 ? "morning" : hour < 16 ? "afternoon" : "evening";

const bulkItems: MockPickupItem[] = [
  { name: "T-shirts & shirts", quantity: null, size: null, condition: "good" },
  { name: "Trousers & denim", quantity: null, size: null, condition: "fair" },
  { name: "Bedsheets & towels", quantity: null, size: null, condition: "worn" },
];

function itemisedItems(random: Random, count: number): MockPickupItem[] {
  const names = ["Shirt", "T-shirt", "Trousers", "Saree", "Dress", "Kids wear"];
  const items: MockPickupItem[] = [];
  let left = count;
  while (left > 0) {
    const quantity = Math.min(left, random.int(1, 4));
    items.push({
      name: random.pick(names),
      quantity,
      size: random.pick(["S", "M", "L", "XL"]),
      condition: random.pick(["good", "fair", "worn"] as const),
    });
    left -= quantity;
  }
  return items;
}

function build(draft: Draft, rates: MockRates, random: Random): MockPickup {
  const { customer, collector, status } = draft;
  const timeline: MockPickupEvent[] = [
    {
      status: "pending",
      occurredAt: draft.createdAt.toISOString(),
      actor: draft.source === "callCentre" ? "Call centre" : null,
    },
  ];
  if (status === "cancelled") {
    timeline.push({
      status: "cancelled",
      occurredAt: (draft.stepTimes[0] ?? draft.createdAt).toISOString(),
      actor: draft.cancelReason?.startsWith("Customer") ? null : "Call centre",
    });
  } else {
    const reached = flow.indexOf(status);
    for (let i = 1; i <= reached; i++) {
      timeline.push({
        status: flow[i]!,
        occurredAt: draft.stepTimes[i - 1]!.toISOString(),
        actor: collector
          ? `${collector.firstName} ${collector.lastName}`
          : null,
      });
    }
  }

  const weighed = draft.actualWeightKg;
  return {
    id: draft.id,
    customerId: customer.id,
    collectorId: collector?.id ?? null,
    status,
    source: draft.source,
    method: draft.method,
    estimatedKg: draft.estimatedKg,
    itemCount: draft.itemCount,
    bagCount: draft.bagCount,
    actualWeightKg: weighed,
    scheduledDate: draft.date,
    slot: slotFor(draft.startHour),
    windowStart: colomboInstant(draft.date, draft.startHour).toISOString(),
    windowEnd: colomboInstant(draft.date, draft.startHour + 1).toISOString(),
    area: customer.area,
    address: customer.address,
    latitude: customer.latitude,
    longitude: customer.longitude,
    note: draft.note ?? null,
    items:
      draft.method === "bulk"
        ? bulkItems.slice(0, Math.min(draft.bagCount, 3))
        : itemisedItems(random, draft.itemCount ?? 4),
    customerRatePerKgCents: rates.customerRatePerKgCents,
    collectorRatePerKgCents: rates.collectorRatePerKgCents,
    customerPayoutCents:
      weighed === null
        ? null
        : Math.round(weighed * rates.customerRatePerKgCents),
    collectorPayoutCents:
      weighed === null
        ? null
        : Math.round(weighed * rates.collectorRatePerKgCents),
    hubId: status === "deliveredToHub" ? (collector?.hubId ?? "hub_plg") : null,
    cancelReason: draft.cancelReason ?? null,
    createdAt: draft.createdAt.toISOString(),
    timeline,
  };
}

/**
 * Today's hand-written pickups (the IDs the apps use) plus 13 days of
 * generated history, so the dashboard's chart and tables have shape.
 */
export function seedPickups(
  random: Random,
  now: Date,
  customers: MockCustomer[],
  collectors: MockCollector[],
  rates: MockRates,
): MockPickup[] {
  const today = colomboDateKey(now);
  const dayStart = colomboInstant(today, 0).getTime();
  // "n minutes ago", but never before today's midnight, so today's
  // figures hold even just after midnight.
  const ago = (minutes: number) =>
    new Date(Math.max(dayStart + 5 * MINUTE, now.getTime() - minutes * MINUTE));
  const customer = (n: number) => customers[n - 1]!;
  const collector = (code: string) => collectors.find((c) => c.code === code)!;
  const steps = (...minutesAgo: number[]) => minutesAgo.map(ago);

  const drafts: Draft[] = [
    {
      id: "RT-24817",
      customer: customer(1),
      collector: collector("COL-0457"),
      status: "enRoute",
      source: "callCentre",
      method: "bulk",
      estimatedKg: 8,
      itemCount: null,
      bagCount: 3,
      actualWeightKg: null,
      date: today,
      startHour: 10,
      createdAt: ago(150),
      stepTimes: steps(120, 12),
      note: "Bags are next to the side gate. Please ring twice — gate code 1144.",
    },
    {
      id: "RT-24822",
      customer: customer(2),
      collector: null,
      status: "pending",
      source: "app",
      method: "itemised",
      estimatedKg: 5.5,
      itemCount: 14,
      bagCount: 2,
      actualWeightKg: null,
      date: today,
      startHour: 11,
      createdAt: ago(55),
      stepTimes: [],
    },
    {
      id: "RT-24830",
      customer: customer(3),
      collector: null,
      status: "pending",
      source: "app",
      method: "bulk",
      estimatedKg: 12,
      itemCount: null,
      bagCount: 4,
      actualWeightKg: null,
      date: today,
      startHour: 13,
      createdAt: ago(35),
      stepTimes: [],
    },
    {
      id: "RT-24835",
      customer: customer(5),
      collector: null,
      status: "pending",
      source: "app",
      method: "itemised",
      estimatedKg: 3.2,
      itemCount: 9,
      bagCount: 1,
      actualWeightKg: null,
      date: today,
      startHour: 14,
      createdAt: ago(20),
      stepTimes: [],
    },
    {
      id: "RT-24841",
      customer: customer(6),
      collector: null,
      status: "pending",
      source: "callCentre",
      method: "bulk",
      estimatedKg: 9.5,
      itemCount: null,
      bagCount: 3,
      actualWeightKg: null,
      date: today,
      startHour: 15,
      createdAt: ago(42),
      stepTimes: [],
      note: "Customer called in: no collector accepted in the app.",
    },
    {
      id: "RT-24844",
      customer: customer(7),
      collector: null,
      status: "pending",
      source: "app",
      method: "bulk",
      estimatedKg: 6,
      itemCount: null,
      bagCount: 2,
      actualWeightKg: null,
      date: today,
      startHour: 16,
      createdAt: ago(8),
      stepTimes: [],
    },
    {
      id: "RT-24826",
      customer: customer(9),
      collector: collector("COL-0466"),
      status: "assigned",
      source: "app",
      method: "itemised",
      estimatedKg: 4.4,
      itemCount: 11,
      bagCount: 2,
      actualWeightKg: null,
      date: today,
      startHour: 12,
      createdAt: ago(90),
      stepTimes: steps(70),
    },
    {
      id: "RT-24819",
      customer: customer(8),
      collector: collector("COL-0480"),
      status: "arrived",
      source: "app",
      method: "bulk",
      estimatedKg: 18,
      itemCount: null,
      bagCount: 5,
      actualWeightKg: null,
      date: today,
      startHour: 10,
      createdAt: ago(200),
      stepTimes: steps(180, 30, 6),
    },
    // RT-24790/96/803 are the collector app's sample load: 20.5 kg in all.
    ...(
      [
        ["RT-24790", 10, 6.2, 260],
        ["RT-24796", 11, 7.1, 200],
        ["RT-24803", 12, 7.2, 140],
      ] as const
    ).map(([id, n, kg, minutes]): Draft => ({
      id,
      customer: customer(n),
      collector: collector("COL-0457"),
      status: "collected",
      source: "app",
      method: "bulk",
      estimatedKg: Math.round(kg),
      itemCount: null,
      bagCount: 2,
      actualWeightKg: kg,
      date: today,
      startHour: 8,
      createdAt: ago(minutes + 120),
      stepTimes: steps(minutes + 90, minutes + 30, minutes + 10, minutes),
    })),
    {
      id: "RT-24806",
      customer: customer(12),
      collector: collector("COL-0312"),
      status: "deliveredToHub",
      source: "app",
      method: "bulk",
      estimatedKg: 10,
      itemCount: null,
      bagCount: 3,
      actualWeightKg: 9.8,
      date: today,
      startHour: 8,
      createdAt: ago(400),
      stepTimes: steps(380, 300, 280, 260, 60),
    },
    {
      id: "RT-24811",
      customer: customer(13),
      collector: collector("COL-0388"),
      status: "collected",
      source: "callCentre",
      method: "bulk",
      estimatedKg: 15,
      itemCount: null,
      bagCount: 5,
      actualWeightKg: 14.3,
      date: today,
      startHour: 9,
      createdAt: ago(320),
      stepTimes: steps(300, 200, 180, 165),
    },
    {
      id: "RT-24813",
      customer: customer(14),
      collector: collector("COL-0515"),
      status: "collected",
      source: "app",
      method: "itemised",
      estimatedKg: 3,
      itemCount: 8,
      bagCount: 1,
      actualWeightKg: 3.4,
      date: today,
      startHour: 9,
      createdAt: ago(280),
      stepTimes: steps(260, 150, 130, 115),
    },
    {
      id: "RT-24815",
      customer: customer(15),
      collector: null,
      status: "cancelled",
      source: "app",
      method: "bulk",
      estimatedKg: 5,
      itemCount: null,
      bagCount: 2,
      actualWeightKg: null,
      date: today,
      startHour: 11,
      createdAt: ago(240),
      stepTimes: steps(190),
      cancelReason: "Customer cancelled in the app.",
    },
  ];

  // History: RT-24789 downwards, 13 days back.
  const active = collectors.filter((c) => c.status === "active");
  let number = 24789;
  for (let back = 1; back <= 13; back++) {
    const date = addDays(today, -back);
    const count = random.int(6, 13);
    for (let i = 0; i < count; i++) {
      const startHour = random.int(8, 17);
      const created = colomboInstant(
        date,
        Math.max(6, startHour - 3),
        random.int(0, 59),
      );
      const cancelled = random.chance(0.08);
      const kg = random.kg(2, 16);
      const est = Math.max(1, Math.round(kg + (random.next() - 0.5) * 3));
      const itemised = random.chance(0.4);
      const t = (minutes: number) =>
        new Date(created.getTime() + minutes * MINUTE);
      drafts.push({
        id: `RT-${number--}`,
        customer: random.pick(customers),
        collector: cancelled ? null : random.pick(active),
        status: cancelled
          ? "cancelled"
          : back === 1 && random.chance(0.2)
            ? "collected"
            : "deliveredToHub",
        source: random.chance(0.25) ? "callCentre" : "app",
        method: itemised ? "itemised" : "bulk",
        estimatedKg: est,
        itemCount: itemised ? random.int(5, 20) : null,
        bagCount: random.int(1, 5),
        actualWeightKg: cancelled ? null : kg,
        date,
        startHour,
        createdAt: created,
        stepTimes: cancelled
          ? [t(random.int(20, 120))]
          : [t(15), t(160), t(185), t(200), t(200 + random.int(120, 400))],
        cancelReason: cancelled
          ? random.pick([
              "Customer cancelled in the app.",
              "Customer asked the call centre to cancel.",
            ])
          : undefined,
      });
    }
  }

  return drafts.map((draft) => build(draft, rates, random));
}
