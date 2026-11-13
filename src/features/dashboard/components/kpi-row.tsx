import { Package, Scale, ShoppingBag, Truck } from "lucide-react";

import { StatCard } from "@/components/app/stat-card";
import { formatCount, formatMoney, formatWeight } from "@/core/format/format";
import type { Dashboard } from "@/features/dashboard/data/models";

export function KpiRow({ dashboard }: { dashboard: Dashboard }) {
  const { pickupsToday: p } = dashboard;
  const inProgress = p.assigned + p.enRoute + p.arrived;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        highlight
        label="Pickups today"
        value={formatCount(p.total)}
        hint={`${p.pending} waiting · ${inProgress} in progress · ${p.collected + p.deliveredToHub} done`}
        icon={Package}
        href="/pickups"
      />
      <StatCard
        label="Collected today"
        value={formatWeight(dashboard.collectedTodayKg, 1)}
        hint={`${formatMoney(dashboard.customerPayoutsTodayCents, { decimals: false })} to customers · ${formatMoney(dashboard.collectorPayoutsTodayCents, { decimals: false })} to collectors`}
        icon={Scale}
      />
      <StatCard
        label="Collectors online"
        value={
          <>
            {dashboard.collectors.online}
            <span className="text-lg font-semibold text-muted-foreground">
              {" "}
              / {dashboard.collectors.active}
            </span>
          </>
        }
        hint="Active collectors sharing their location"
        icon={Truck}
        href="/dispatch"
      />
      <StatCard
        label="Open orders"
        value={formatCount(dashboard.orders.open)}
        hint={`${dashboard.orders.placedToday} placed today`}
        icon={ShoppingBag}
        href="/orders"
      />
    </div>
  );
}
