import { StatusPill, type PillTone } from "@/components/app/status-pill";
import { formatDateTime } from "@/core/format/format";
import type {
  Assignment,
  AssignmentStatus,
} from "@/features/assignments/data/models";

const labels: Record<AssignmentStatus, [string, PillTone]> = {
  offered: ["Waiting", "warning"],
  accepted: ["Accepted", "success"],
  declined: ["Declined", "danger"],
  expired: ["No answer", "neutral"],
  withdrawn: ["Withdrawn", "neutral"],
};

/** Every call-centre offer made for a pickup, newest first. */
export function OfferHistory({ assignments }: { assignments: Assignment[] }) {
  return (
    <ul className="flex flex-col divide-y">
      {assignments.map((a) => {
        const [label, tone] = labels[a.status];
        return (
          <li
            key={a.id}
            className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                {a.collector.name}{" "}
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {a.collector.code}
                </span>
              </span>
              <StatusPill tone={tone}>{label}</StatusPill>
            </span>
            <span className="text-xs text-muted-foreground">
              Offered by {a.offeredBy} · {formatDateTime(a.offeredAt)}
              {a.declineReason ? ` · “${a.declineReason}”` : ""}
            </span>
            {a.note && <span className="text-xs">Note: {a.note}</span>}
          </li>
        );
      })}
    </ul>
  );
}
