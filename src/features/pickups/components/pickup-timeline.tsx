import { Check, X } from "lucide-react";

import { formatDateTime } from "@/core/format/format";
import type { PickupDetail } from "@/features/pickups/data/models";
import {
  pickupStatusLabels,
  type PickupStatus,
} from "@/features/pickups/data/pickup-status";
import { cn } from "@/lib/utils";

const flow: PickupStatus[] = [
  "pending",
  "assigned",
  "enRoute",
  "arrived",
  "collected",
  "deliveredToHub",
];

const stepLabels: Record<PickupStatus, string> = {
  ...pickupStatusLabels,
  pending: "Requested",
  assigned: "Collector assigned",
  deliveredToHub: "Delivered to hub",
};

/** What has happened, then the steps still to come (greyed). */
export function PickupTimeline({ pickup }: { pickup: PickupDetail }) {
  const happened = pickup.timeline;
  const cancelled = pickup.status === "cancelled";
  const upcoming = cancelled ? [] : flow.slice(flow.indexOf(pickup.status) + 1);

  return (
    <ol className="flex flex-col">
      {happened.map((event, i) => {
        const isCancel = event.status === "cancelled";
        const last = i === happened.length - 1 && upcoming.length === 0;
        return (
          <li key={`${event.status}-${i}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  isCancel
                    ? "bg-destructive text-white"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {isCancel ? (
                  <X className="size-3.5" />
                ) : (
                  <Check className="size-3.5" />
                )}
              </span>
              {!last && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className="flex flex-col pb-5">
              <span className="text-sm font-semibold">
                {stepLabels[event.status]}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(event.occurredAt)}
                {event.actor ? ` · ${event.actor}` : ""}
              </span>
              {isCancel && pickup.cancelReason && (
                <span className="mt-1 text-xs text-destructive">
                  {pickup.cancelReason}
                </span>
              )}
            </div>
          </li>
        );
      })}
      {upcoming.map((status, i) => (
        <li key={status} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="size-6 shrink-0 rounded-full border-2 border-dashed border-input" />
            {i < upcoming.length - 1 && (
              <span className="w-px flex-1 bg-border" />
            )}
          </div>
          <span className="pb-5 text-sm text-muted-foreground">
            {stepLabels[status]}
          </span>
        </li>
      ))}
    </ol>
  );
}
