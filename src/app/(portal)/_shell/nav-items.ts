import {
  Bell,
  HeartHandshake,
  LayoutDashboard,
  MapPinned,
  Package,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { canAccess, type Role } from "@/core/auth/roles";

export type NavItem = { title: string; href: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

/** The portal's sections. Admin-only ones are filtered by canAccess(). */
export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    label: "Dispatch",
    items: [
      { title: "Live map", href: "/dispatch", icon: MapPinned },
      { title: "Pickups", href: "/pickups", icon: Package },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { title: "Orders", href: "/orders", icon: ShoppingBag },
      { title: "Catalogue", href: "/catalogue", icon: Shirt },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Redemptions", href: "/redemptions", icon: Wallet },
      { title: "Donations", href: "/donations", icon: HeartHandshake },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Customers", href: "/customers", icon: Users },
      { title: "Collectors", href: "/collectors", icon: Truck },
      { title: "Staff", href: "/staff", icon: ShieldCheck },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Rates & impact", href: "/rates", icon: SlidersHorizontal },
    ],
  },
];

export function navGroupsFor(role: Role): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(role, item.href)),
    }))
    .filter((group) => group.items.length > 0);
}

/** The nav item a path belongs to, for the top bar's title. */
export function navItemFor(pathname: string): NavItem | undefined {
  return navGroups
    .flatMap((group) => group.items)
    .find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
}
