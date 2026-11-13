import { addDays, colomboDateKey, colomboInstant } from "@/core/time";
import type { Random } from "@/mock/seed/random";
import type {
  MockCustomer,
  MockOrder,
  MockProduct,
  MockRates,
  MockVendor,
  OrderStatus,
} from "@/mock/types";

const MINUTE = 60_000;

/** Click & collect points (pctw-user `GET /fulfilment-options`). */
export const seedVendors = (): MockVendor[] => [
  {
    id: "vnd_nugegoda",
    name: "ReThread Point – Nugegoda",
    address: "88 High Level Rd, Nugegoda",
  },
  {
    id: "vnd_kollupitiya",
    name: "ReThread Point – Kollupitiya",
    address: "21 Duplication Rd, Colombo 03",
  },
];

const productRows: [
  name: string,
  category: MockProduct["category"],
  rupees: number,
  sizes: string[],
  stock: number,
  story: string,
][] = [
  [
    "Patchwork Denim Jacket",
    "women",
    3450,
    ["XS", "S", "M", "L", "XL"],
    6,
    "Cut from 4 pairs of collected jeans, re-stitched in Moratuwa.",
  ],
  [
    "Batik Panel Shirt",
    "men",
    2200,
    ["S", "M", "L", "XL"],
    9,
    "Old batik sarongs given a second life as shirt panels.",
  ],
  [
    "Saree Silk Scarf",
    "accessories",
    950,
    ["One size"],
    24,
    "Hemmed from the borders of donated silk sarees.",
  ],
  [
    "Reworked Linen Trousers",
    "men",
    2800,
    ["30", "32", "34", "36"],
    5,
    "Linen trousers re-tailored with new waistbands.",
  ],
  [
    "Kids' Upcycled Dungarees",
    "kids",
    1650,
    ["2-3Y", "4-5Y", "6-7Y"],
    11,
    "Made from adult denim offcuts.",
  ],
  [
    "Wrap Dress — Sunset Print",
    "women",
    2950,
    ["S", "M", "L"],
    4,
    "Two cotton dresses combined into one wrap.",
  ],
  [
    "Tote Bag — Denim Mix",
    "accessories",
    750,
    ["One size"],
    30,
    "Leftover denim and canvas, lined with shirt cotton.",
  ],
  [
    "Kids' T-shirt Bundle (3)",
    "kids",
    1200,
    ["4-5Y", "6-7Y", "8-9Y"],
    14,
    "Sorted, washed and repaired tees.",
  ],
  [
    "Oversized Flannel Shirt",
    "women",
    2400,
    ["S", "M", "L"],
    0,
    "Brushed flannel with mended elbows.",
  ],
  [
    "Denim Bucket Hat",
    "accessories",
    890,
    ["One size"],
    18,
    "From jean legs too worn for trousers.",
  ],
];

export function seedProducts(random: Random, now: Date): MockProduct[] {
  return productRows.map(
    ([name, category, rupees, sizes, stock, story], i) => ({
      id: `prd_${i + 1}`,
      name,
      category,
      sizes,
      priceCents: rupees * 100,
      stock,
      published: i !== 8,
      imageUrl: null,
      story,
      createdAt: new Date(
        now.getTime() - random.int(0, 30) * 86_400_000 - i * MINUTE,
      ).toISOString(),
    }),
  );
}

/** Statuses in the order they happen, for building an order's timeline. */
const deliveryFlow: OrderStatus[] = [
  "placed",
  "confirmed",
  "outForDelivery",
  "completed",
];
const collectFlow: OrderStatus[] = [
  "placed",
  "confirmed",
  "readyAtVendor",
  "completed",
];

export function seedOrders(
  random: Random,
  now: Date,
  customers: MockCustomer[],
  products: MockProduct[],
  vendors: MockVendor[],
  rates: MockRates,
): MockOrder[] {
  const today = colomboDateKey(now);
  const dayStart = colomboInstant(today, 0).getTime();
  const ago = (minutes: number) =>
    new Date(Math.max(dayStart + 5 * MINUTE, now.getTime() - minutes * MINUTE));

  // [daysAgo, minutesAgo today, fulfilment, how far along]
  const plan: [
    number,
    number,
    MockOrder["fulfilmentType"],
    number | "cancelled",
  ][] = [
    [0, 14, "homeDelivery", 0],
    [0, 48, "clickAndCollect", 0],
    [0, 130, "homeDelivery", 1],
    [1, 0, "homeDelivery", 2],
    [1, 0, "clickAndCollect", 2],
    [2, 0, "homeDelivery", 3],
    [2, 0, "clickAndCollect", "cancelled"],
    [3, 0, "clickAndCollect", 3],
    [4, 0, "homeDelivery", 3],
    [6, 0, "homeDelivery", 3],
    [8, 0, "clickAndCollect", 3],
    [9, 0, "homeDelivery", 3],
  ];

  let number = 5134;
  let waybill = 12;
  return plan.map(([daysAgo, minutesAgo, fulfilmentType, progress]) => {
    const customer = random.pick(customers);
    const lines = Array.from({ length: random.int(1, 3) }, () => {
      const product = random.pick(products.filter((p) => p.published));
      return {
        productId: product.id,
        name: product.name,
        size: random.pick(product.sizes),
        quantity: random.chance(0.8) ? 1 : 2,
        unitPriceCents: product.priceCents,
      };
    });
    const subtotalCents = lines.reduce(
      (sum, line) => sum + line.unitPriceCents * line.quantity,
      0,
    );
    const transportChargeCents =
      fulfilmentType === "homeDelivery"
        ? rates.homeDeliveryChargeCents
        : rates.clickAndCollectChargeCents;
    const vendor =
      fulfilmentType === "clickAndCollect" ? random.pick(vendors) : null;

    const createdAt =
      daysAgo === 0
        ? ago(minutesAgo)
        : colomboInstant(
            addDays(today, -daysAgo),
            random.int(8, 20),
            random.int(0, 59),
          );
    const flow = fulfilmentType === "homeDelivery" ? deliveryFlow : collectFlow;
    const reached = progress === "cancelled" ? 0 : progress;
    const timeline: MockOrder["timeline"] = flow
      .slice(0, reached + 1)
      .map((status, i) => ({
        status,
        occurredAt: new Date(
          createdAt.getTime() + i * 18 * 60 * MINUTE,
        ).toISOString(),
        actor: i === 0 ? null : "Kasun Jayawardena",
      }));
    if (progress === "cancelled") {
      timeline.push({
        status: "cancelled",
        occurredAt: new Date(createdAt.getTime() + 90 * MINUTE).toISOString(),
        actor: null,
      });
    }
    const status = timeline[timeline.length - 1]!.status;
    const id = `ORD-${number--}`;
    const dateCode = colomboDateKey(createdAt).slice(2).replaceAll("-", "");

    return {
      id,
      customerId: customer.id,
      items: lines,
      fulfilmentType,
      destination: vendor ? vendor.address : customer.address,
      vendorId: vendor?.id ?? null,
      paymentMethod: random.chance(0.6) ? "wallet" : "card",
      subtotalCents,
      transportChargeCents,
      totalCents: subtotalCents + transportChargeCents,
      status,
      waybillNumber:
        reached >= 1 && progress !== "cancelled"
          ? `WB-${dateCode}-${String(waybill++).padStart(4, "0")}`
          : null,
      createdAt: createdAt.toISOString(),
      timeline,
    };
  });
}
