import type { Role } from "@/core/auth/roles";

export type MockStaffAccount = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "suspended";
  /** Mock only. The real API stores a hash. */
  password: string;
  lastSignInAt: string | null;
};

/** Sign-in accounts for mock mode. Documented in the README. */
export const seedStaff = (): MockStaffAccount[] => [
  {
    id: "stf_1",
    name: "Nadeesha Perera",
    email: "admin@rethread.lk",
    role: "admin",
    status: "active",
    password: "rethread-admin",
    lastSignInAt: "2026-11-06T03:00:00.000Z",
  },
  {
    id: "stf_2",
    name: "Kasun Jayawardena",
    email: "callcentre@rethread.lk",
    role: "callCentre",
    status: "active",
    password: "rethread-callcentre",
    lastSignInAt: "2026-11-06T02:40:00.000Z",
  },
  {
    id: "stf_3",
    name: "Ishara Fernando",
    email: "ishara@rethread.lk",
    role: "callCentre",
    status: "suspended",
    password: "rethread-callcentre",
    lastSignInAt: "2026-09-12T08:10:00.000Z",
  },
];
