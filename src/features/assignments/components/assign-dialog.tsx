"use client";

import { useActionForm } from "@/hooks/use-action-form";

import {
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  UserRoundX,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/core/action-result";
import { errorMessage } from "@/core/api/api-error";
import { formatDistance, formatWeight } from "@/core/format/format";
import { offerPickup, withdrawOffer } from "@/features/assignments/actions";
import {
  assignmentSchema,
  OFFER_SECONDS,
  type Assignment,
} from "@/features/assignments/data/models";
import type { Candidate } from "@/features/dispatch/dispatch-view";
import { cn } from "@/lib/utils";

const POLL_MS = 2_000;

const offerErrors: Record<string, string> = {
  PICKUP_ALREADY_ASSIGNED: "Someone else already has this pickup.",
  ASSIGNMENT_PENDING:
    "An offer for this pickup is still open. Wait for it, or withdraw it.",
  COLLECTOR_OFFLINE: "That collector just went offline. Choose someone else.",
  LOAD_FULL: "That collector has no room left for this pickup.",
};

/**
 * Offer a pending pickup to a collector and watch for the answer. The
 * collector app shows the offer with a 45-second countdown.
 */
export function AssignDialog({
  pickup,
  candidates,
  openAssignmentId,
  defaultCollectorId,
  trigger,
  onSettled,
}: {
  pickup: { id: string; area: string; estimatedKg: number };
  candidates: Candidate[];
  /** An offer already in flight, to watch instead of making a new one. */
  openAssignmentId?: string;
  defaultCollectorId?: string;
  trigger: React.ReactNode;
  /** Called after the collector has answered and the dialog closes, so the caller can reload. */
  onSettled?: (assignment: Assignment) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [watching, setWatching] = useState<Assignment | null>(null);
  const [outcome, setOutcome] = useState<Assignment | null>(null);
  const [collectorId, setCollectorId] = useState(defaultCollectorId ?? "");

  const [state, action, submitting] = useActionForm<
    ActionResult<Assignment> | null,
    FormData
  >(async (previous, formData) => {
    const result = await offerPickup(pickup.id, previous, formData);
    if (result.ok) {
      setWatching(result.data);
      setOutcome(null);
    }
    return result;
  }, null);

  // Pick up an offer made earlier (from the map, say) when the dialog opens.
  useEffect(() => {
    if (!open || !openAssignmentId) return;
    let cancelled = false;
    void fetchAssignment(openAssignmentId).then((assignment) => {
      if (!cancelled && assignment?.status === "offered")
        setWatching(assignment);
    });
    return () => {
      cancelled = true;
    };
  }, [open, openAssignmentId]);

  useEffect(() => {
    if (!watching || watching.status !== "offered") return;
    const timer = setInterval(async () => {
      const latest = await fetchAssignment(watching.id);
      if (!latest || latest.status === "offered") return;
      setWatching(null);
      setOutcome(latest);
      if (latest.status === "accepted") {
        toast.success(`${latest.collector.name} accepted ${pickup.id}.`);
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [watching, pickup.id]);

  const failed = state && !state.ok ? state : undefined;
  const reset = () => {
    setOutcome(null);
    setWatching(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && outcome) {
          // Reload only now: refreshing while open would unmount this
          // dialog (the pickup stops being pending) before the outcome shows.
          onSettled?.(outcome);
          router.refresh();
          reset();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign {pickup.id}</DialogTitle>
          <DialogDescription>
            {pickup.area} · about {formatWeight(pickup.estimatedKg, 1)}. The
            collector gets {OFFER_SECONDS} seconds to accept in their app.
          </DialogDescription>
        </DialogHeader>

        {watching ? (
          <Waiting assignment={watching} onWithdrawn={reset} />
        ) : outcome ? (
          <Outcome
            assignment={outcome}
            onTryAgain={reset}
            onClose={() => {
              setOpen(false);
              onSettled?.(outcome);
              router.refresh();
              reset();
            }}
          />
        ) : (
          <form onSubmit={action} className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">
                Online collectors, nearest first
              </legend>
              {candidates.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No collectors are online right now.
                </p>
              )}
              <div className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
                {candidates.map((c) => (
                  <label
                    key={c.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 has-checked:border-primary has-checked:bg-secondary",
                      !c.hasRoom && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <input
                      type="radio"
                      name="collectorId"
                      value={c.id}
                      disabled={!c.hasRoom}
                      checked={collectorId === c.id}
                      onChange={() => setCollectorId(c.id)}
                      className="size-4 accent-primary"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold">
                        {c.name}{" "}
                        <span className="font-mono text-xs font-medium text-muted-foreground">
                          {c.code}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistance(c.distanceKm)} away · carrying{" "}
                        {formatWeight(c.loadKg, 1)} of {c.capacityKg} kg
                        {c.busy ? " · on another job" : ""}
                        {!c.hasRoom ? " · no room" : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`note-${pickup.id}`}>
                Note for the collector{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id={`note-${pickup.id}`}
                name="note"
                maxLength={200}
                rows={2}
                placeholder="For example: customer prefers before 3 PM"
              />
            </div>

            {failed && (
              <p role="alert" className="text-sm text-destructive">
                {failed.fieldErrors?.collectorId ??
                  offerErrors[failed.error.code] ??
                  errorMessage(failed.error)}
              </p>
            )}

            <DialogFooter>
              <Button type="submit" disabled={submitting || !collectorId}>
                {submitting ? <Loader2 className="animate-spin" /> : <Send />}
                Send offer
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

async function fetchAssignment(id: string): Promise<Assignment | null> {
  try {
    const response = await fetch(`/api/assignments/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return assignmentSchema.parse(await response.json());
  } catch {
    return null;
  }
}

function Waiting({
  assignment,
  onWithdrawn,
}: {
  assignment: Assignment;
  onWithdrawn: () => void;
}) {
  const secondsLeft = useSecondsUntil(assignment.expiresAt);
  const [withdrawing, startWithdraw] = useTransition();
  const share = (secondsLeft / OFFER_SECONDS) * 100;

  return (
    <div
      className="flex flex-col items-center gap-4 py-2 text-center"
      aria-live="polite"
    >
      <div className="relative flex size-24 items-center justify-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="16"
            className="fill-none stroke-muted"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            className="fill-none stroke-lime transition-[stroke-dasharray] duration-1000 ease-linear"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${share} 100`}
            pathLength={100}
          />
        </svg>
        <span className="font-heading text-2xl font-bold tabular-nums">
          {secondsLeft}s
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">
          Waiting for {assignment.collector.name} to answer
        </p>
        <p className="text-sm text-muted-foreground">
          The offer is on their phone. This updates by itself.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={withdrawing}
        onClick={() =>
          startWithdraw(async () => {
            const result = await withdrawOffer(assignment.id);
            if (result.ok) {
              toast(`Offer to ${assignment.collector.name} withdrawn.`);
              onWithdrawn();
            } else {
              toast.error(errorMessage(result.error));
            }
          })
        }
      >
        <UserRoundX />
        Withdraw offer
      </Button>
    </div>
  );
}

function Outcome({
  assignment,
  onTryAgain,
  onClose,
}: {
  assignment: Assignment;
  onTryAgain: () => void;
  onClose: () => void;
}) {
  const name = assignment.collector.name;
  const view =
    assignment.status === "accepted"
      ? {
          icon: CheckCircle2,
          tone: "text-success",
          title: `${name} accepted`,
          body: "The pickup is theirs, and the customer has been told.",
        }
      : assignment.status === "declined"
        ? {
            icon: XCircle,
            tone: "text-destructive",
            title: `${name} declined`,
            body: assignment.declineReason
              ? `Reason: ${assignment.declineReason}.`
              : "They didn't give a reason.",
          }
        : {
            icon: Clock,
            tone: "text-warning",
            title: `${name} didn't answer in time`,
            body: "The offer expired after 45 seconds.",
          };
  const Icon = view.icon;

  return (
    <div
      className="flex flex-col items-center gap-3 py-2 text-center"
      role="status"
    >
      <Icon className={cn("size-12", view.tone)} />
      <p className="font-heading text-lg font-semibold">{view.title}</p>
      <p className="text-sm text-muted-foreground">{view.body}</p>
      <DialogFooter className="w-full sm:justify-center">
        {assignment.status === "accepted" ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <Button onClick={onTryAgain}>Offer to someone else</Button>
        )}
      </DialogFooter>
    </div>
  );
}

/** Whole seconds left until `iso`, ticking every second. */
function useSecondsUntil(iso: string): number {
  const target = Date.parse(iso);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, Math.ceil((target - now) / 1000));
}
