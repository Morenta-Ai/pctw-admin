import { areas } from "@/mock/seed/places";
import type { Random } from "@/mock/seed/random";
import type { MockCollector, MockCustomer, VehicleType } from "@/mock/types";

const collectorRows: [
  code: string,
  first: string,
  last: string,
  area: string,
  vehicle: VehicleType,
  plate: string,
  capacityKg: number,
  online: boolean,
][] = [
  [
    "COL-0457",
    "Ruwan",
    "Silva",
    "Dehiwala",
    "threeWheeler",
    "WP ABC-1234",
    120,
    true,
  ],
  [
    "COL-0312",
    "Chaminda",
    "Perera",
    "Wellawatte",
    "threeWheeler",
    "WP QA-4521",
    120,
    true,
  ],
  [
    "COL-0388",
    "Mohamed",
    "Rizwan",
    "Bambalapitiya",
    "van",
    "WP PH-2290",
    400,
    true,
  ],
  [
    "COL-0421",
    "Saman",
    "Kumara",
    "Nugegoda",
    "motorbike",
    "WP BGT-7731",
    40,
    true,
  ],
  [
    "COL-0466",
    "Dilshan",
    "Fernando",
    "Rajagiriya",
    "threeWheeler",
    "WP AAK-5562",
    120,
    true,
  ],
  [
    "COL-0473",
    "Tharindu",
    "Wickramasinghe",
    "Battaramulla",
    "threeWheeler",
    "WP ABJ-1180",
    120,
    false,
  ],
  [
    "COL-0480",
    "Nimal",
    "Rathnayake",
    "Mount Lavinia",
    "lorry",
    "WP LH-9034",
    1000,
    true,
  ],
  [
    "COL-0502",
    "Priyantha",
    "Bandara",
    "Kotte",
    "threeWheeler",
    "WP AAQ-3317",
    120,
    false,
  ],
  [
    "COL-0515",
    "Lahiru",
    "Gunasekara",
    "Borella",
    "motorbike",
    "WP BJK-6620",
    40,
    true,
  ],
  [
    "COL-0528",
    "Asanka",
    "de Silva",
    "Maharagama",
    "threeWheeler",
    "WP ABP-2245",
    120,
    false,
  ],
  [
    "COL-0533",
    "Kavindu",
    "Jayasuriya",
    "Kollupitiya",
    "threeWheeler",
    "WP ACD-8891",
    120,
    false,
  ],
  ["COL-0541", "Suresh", "Raj", "Wattala", "van", "WP PJ-4410", 400, false],
];

export function seedCollectors(random: Random, now: Date): MockCollector[] {
  return collectorRows.map(
    (
      [code, firstName, lastName, areaName, type, plate, capacityKg, online],
      i,
    ) => {
      const area = areas.find((a) => a.name === areaName)!;
      const minutesAgo = online ? random.int(0, 4) : random.int(90, 60 * 20);
      return {
        id: `col_${code.slice(4).replace(/^0/, "")}`,
        code,
        firstName,
        lastName,
        mobile: `+9477${String(1234567 + i * 7919).slice(0, 7)}`,
        // COL-0541 is suspended, for the accounts screens.
        status: code === "COL-0541" ? "suspended" : "active",
        online,
        latitude: area.latitude + (random.next() - 0.5) * 0.02,
        longitude: area.longitude + (random.next() - 0.5) * 0.02,
        lastSeenAt: new Date(now.getTime() - minutesAgo * 60_000).toISOString(),
        area: areaName,
        hubId: area.latitude < 6.86 ? "hub_mrt" : "hub_plg",
        vehicle: { type, plate, capacityKg },
        rating: Math.round((4.3 + random.next() * 0.7) * 10) / 10,
        memberSince: `202${4 + (i % 2)}-0${1 + (i % 9)}-01`,
      };
    },
  );
}

const customerNames = [
  ["Nadeesha", "Perera"],
  ["Mohamed", "Fazil"],
  ["Anjali", "Wijesinghe"],
  ["Roshan", "Dias"],
  ["Fathima", "Rinoza"],
  ["Kumudu", "Herath"],
  ["Thilini", "Abeysekara"],
  ["Ravi", "Shankar"],
  ["Sanduni", "Karunaratne"],
  ["Dinesh", "Mendis"],
  ["Hasini", "Jayawardena"],
  ["Pradeep", "Senanayake"],
  ["Malsha", "Gamage"],
  ["Arjun", "Pillai"],
  ["Ishani", "Ekanayake"],
  ["Shehan", "Weerasinghe"],
  ["Nirosha", "Samarasinghe"],
  ["Gayan", "Liyanage"],
  ["Ayesha", "Cassim"],
  ["Chathura", "Wanigasekara"],
] as const;

export function seedCustomers(random: Random, now: Date): MockCustomer[] {
  return customerNames.map(([firstName, lastName], i) => {
    const area = areas[i % areas.length]!;
    const daysAgo = random.int(20, 400);
    return {
      id: `cus_${i + 1}`,
      firstName,
      lastName,
      mobile: `+9476${String(4821190 + i * 3571).slice(0, 7)}`,
      email: random.chance(0.6)
        ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.lk`
        : null,
      area: area.name,
      address: `${random.int(2, 180)}/${random.int(1, 9)} ${random.pick([
        "Galle Road",
        "Station Road",
        "Temple Road",
        "Park Avenue",
        "Lake Drive",
        "High Level Road",
      ])}, ${area.name}`,
      latitude: area.latitude + (random.next() - 0.5) * 0.015,
      longitude: area.longitude + (random.next() - 0.5) * 0.015,
      joinedAt: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
      // cus_18 is suspended, for the accounts screens.
      status: i === 17 ? "suspended" : "active",
      familyMemberCount: random.int(0, 4),
    };
  });
}
