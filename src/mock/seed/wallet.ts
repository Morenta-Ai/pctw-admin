import type {
  MockCustomer,
  MockDonationProject,
  MockRedemption,
} from "@/mock/types";

export const seedDonationProjects = (): MockDonationProject[] => [
  {
    id: "dp_monaragala",
    name: "School uniforms for Monaragala kids",
    summary: "Education · 420 children",
    goalCents: 50_000_000,
    baseRaisedCents: 33_950_000,
    baseDonorCount: 811,
    active: true,
    endsOn: "2026-12-31",
    createdAt: "2026-08-01T04:00:00.000Z",
  },
  {
    id: "dp_jaffna_library",
    name: "Reading corner for Jaffna library",
    summary: "Education · 3 schools",
    goalCents: 20_000_000,
    baseRaisedCents: 8_400_000,
    baseDonorCount: 230,
    active: true,
    endsOn: null,
    createdAt: "2026-09-15T04:00:00.000Z",
  },
  {
    id: "dp_flood_relief",
    name: "Kelani flood relief clothing",
    summary: "Relief · 600 families",
    goalCents: 30_000_000,
    baseRaisedCents: 30_000_000,
    baseDonorCount: 1_204,
    active: false,
    endsOn: "2026-07-31",
    createdAt: "2026-06-05T04:00:00.000Z",
  },
];

const banks = [
  ["Commercial Bank", "Kollupitiya"],
  ["Bank of Ceylon", "Wellawatte"],
  ["Sampath Bank", "Nugegoda"],
  ["HNB", "Dehiwala"],
] as const;

/**
 * A few weeks of wallet activity. Amounts stay well under each customer's
 * earnings, so every balance stays positive.
 */
export function seedRedemptions(
  now: Date,
  customers: MockCustomer[],
  earnedCents: (customerId: string) => number,
): MockRedemption[] {
  const hoursAgo = (h: number) =>
    new Date(now.getTime() - h * 3_600_000).toISOString();
  const rich = customers
    .filter((c) => c.status === "active")
    .sort((a, b) => earnedCents(b.id) - earnedCents(a.id));
  const customer = (n: number) => rich[n % rich.length]!;
  const bank = (c: MockCustomer, n: number) => ({
    bankName: banks[n % banks.length]![0],
    branch: banks[n % banks.length]![1],
    accountName: `${c.firstName} ${c.lastName}`,
    accountNumber: String(8_001_234_000 + n * 7_919),
  });
  const base = {
    voucher: null,
    projectId: null,
    processedAt: null,
    processedBy: null,
    reference: null,
    rejectReason: null,
  };

  return [
    {
      ...base,
      id: "red_1",
      customerId: customer(0).id,
      type: "cash",
      status: "pending",
      amountCents: 200_000,
      bank: bank(customer(0), 1),
      requestedAt: hoursAgo(26),
    },
    {
      ...base,
      id: "red_2",
      customerId: customer(1).id,
      type: "cash",
      status: "pending",
      amountCents: 75_000,
      bank: bank(customer(1), 2),
      requestedAt: hoursAgo(9),
    },
    {
      ...base,
      id: "red_3",
      customerId: customer(2).id,
      type: "cash",
      status: "pending",
      amountCents: 120_000,
      bank: bank(customer(2), 3),
      requestedAt: hoursAgo(2),
    },
    {
      ...base,
      id: "red_4",
      customerId: customer(3).id,
      type: "cash",
      status: "paid",
      amountCents: 50_000,
      bank: bank(customer(3), 4),
      requestedAt: hoursAgo(80),
      processedAt: hoursAgo(70),
      processedBy: "Nadeesha Perera",
      reference: "CEFT 1103-55120",
    },
    {
      ...base,
      id: "red_5",
      customerId: customer(4).id,
      type: "cash",
      status: "rejected",
      amountCents: 60_000,
      bank: bank(customer(4), 5),
      requestedAt: hoursAgo(120),
      processedAt: hoursAgo(110),
      processedBy: "Kasun Jayawardena",
      rejectReason: "Account name doesn't match the customer.",
    },
    {
      ...base,
      id: "red_6",
      customerId: customer(1).id,
      type: "voucher",
      status: "completed",
      amountCents: 100_000,
      bank: null,
      voucher: { brandName: "Lanka Fresh Supermarkets", code: "LF-7KQ2-4821" },
      requestedAt: hoursAgo(30),
      processedAt: hoursAgo(30),
    },
    {
      ...base,
      id: "red_7",
      customerId: customer(5).id,
      type: "voucher",
      status: "completed",
      amountCents: 50_000,
      bank: null,
      voucher: { brandName: "Odel", code: "OD-2MX9-1130" },
      requestedAt: hoursAgo(55),
      processedAt: hoursAgo(55),
    },
    {
      ...base,
      id: "red_8",
      customerId: customer(2).id,
      type: "donation",
      status: "completed",
      amountCents: 50_000,
      bank: null,
      projectId: "dp_monaragala",
      requestedAt: hoursAgo(5),
      processedAt: hoursAgo(5),
    },
    {
      ...base,
      id: "red_9",
      customerId: customer(6).id,
      type: "donation",
      status: "completed",
      amountCents: 25_000,
      bank: null,
      projectId: "dp_jaffna_library",
      requestedAt: hoursAgo(48),
      processedAt: hoursAgo(48),
    },
  ];
}
