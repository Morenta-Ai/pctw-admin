"use client";

import { usePathname } from "next/navigation";

import { navItemFor } from "./nav-items";

/** The current section's name, from the URL. */
export function SectionTitle() {
  const item = navItemFor(usePathname());
  if (!item) return null;
  return (
    <span className="flex items-center gap-2 text-sm font-semibold">
      <item.icon className="size-4 text-muted-foreground" />
      {item.title}
    </span>
  );
}
