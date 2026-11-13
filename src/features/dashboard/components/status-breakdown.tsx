import Link from "next/link";

import { StatusPill } from "@/components/app/status-pill";
import type { Dashboard } from "@/features/dashboard/data/models";
import {
  pickupStatuses,
  pickupStatusLabels,
  pickupStatusTones,
} from "@/features/pickups/data/pickup-status";

/** Today's pickups by status, each linking to the filtered pickups table. */
export function StatusBreakdown({
  counts,
}: {
  counts: Dashboard["pickupsToday"];
}) {
  return (
    <ul className="flex flex-col gap-3">
      {pickupStatuses.map((status) => {
        const count = counts[status];
        const share = counts.total === 0 ? 0 : (count / counts.total) * 100;
        return (
          <li key={status}>
            <Link
              href={`/pickups?status=${status}&date=today`}
              className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted"
            >
              <StatusPill
                tone={pickupStatusTones[status]}
                className="w-24 justify-center"
              >
                {pickupStatusLabels[status]}
              </StatusPill>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${share}%` }}
                />
              </span>
              <span className="w-6 text-right text-sm font-semibold tabular-nums">
                {count}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
