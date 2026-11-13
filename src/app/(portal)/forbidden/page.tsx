import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "No access" };

/** Where proxy.ts and requireRole() send call-centre staff from admin-only sections. */
export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-warning-bg text-warning">
        <ShieldAlert className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">
          You don&apos;t have access to that
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Rates, the catalogue, donation campaigns and staff accounts are
          managed by admins. Ask an admin if you need a change there.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Back to the dashboard</Link>
      </Button>
    </div>
  );
}
