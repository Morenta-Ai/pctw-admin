import { ArrowLeft, Phone, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/core/auth/session";
import {
  formatDateTime,
  formatLkMobile,
  formatMoney,
  formatTimeWindow,
  formatWeekdayDate,
  formatWeight,
} from "@/core/format/format";
import { AssignDialog } from "@/features/assignments/components/assign-dialog";
import { OfferHistory } from "@/features/assignments/components/offer-history";
import { getAssignmentsRepository } from "@/features/assignments/data/assignments-repository";
import { getDispatchRepository } from "@/features/dispatch/data/dispatch-repository";
import {
  rankCandidates,
  type Candidate,
} from "@/features/dispatch/dispatch-view";
import { CancelPickupDialog } from "@/features/pickups/components/cancel-pickup-dialog";
import { PickupTimeline } from "@/features/pickups/components/pickup-timeline";
import type { PickupDetail } from "@/features/pickups/data/models";
import {
  cancellableStatuses,
  pickupSourceLabels,
  pickupStatusLabels,
  pickupStatusTones,
} from "@/features/pickups/data/pickup-status";
import { getPickupsRepository } from "@/features/pickups/data/pickups-repository";

export async function generateMetadata({
  params,
}: PageProps<"/pickups/[id]">): Promise<Metadata> {
  return { title: (await params).id };
}

export default async function PickupPage({
  params,
}: PageProps<"/pickups/[id]">) {
  await requireRole();
  const { id } = await params;
  const result = await getPickupsRepository().get(decodeURIComponent(id));
  if (!result.ok) {
    if (result.error.isNotFound) notFound();
    throw result.error;
  }
  const pickup = result.data;
  const [offers, candidates] = await Promise.all([
    getAssignmentsRepository().listForPickup(pickup.id),
    pickup.status === "pending" ? candidatesFor(pickup) : Promise.resolve([]),
  ]);
  const history = offers.ok ? offers.data : [];
  const openOffer = history.find((a) => a.status === "offered");

  return (
    <>
      <Link
        href="/pickups"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Pickups
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold sm:text-3xl">
              {pickup.id}
            </h1>
            <StatusPill tone={pickupStatusTones[pickup.status]}>
              {pickupStatusLabels[pickup.status]}
            </StatusPill>
          </div>
          <p className="text-sm text-muted-foreground">
            {pickup.method === "bulk" ? "Bulk" : "Itemised"} pickup · booked{" "}
            {pickup.source === "app" ? "in the app" : "by the call centre"} on{" "}
            {formatDateTime(pickup.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pickup.status === "pending" && (
            <AssignDialog
              pickup={pickup}
              candidates={candidates}
              openAssignmentId={openOffer?.id}
              trigger={
                <Button>
                  <UserPlus />
                  {openOffer
                    ? `Offered to ${openOffer.collector.name}`
                    : "Assign collector"}
                </Button>
              }
            />
          )}
          {cancellableStatuses.includes(pickup.status) && (
            <CancelPickupDialog pickupId={pickup.id} />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <SummaryCard pickup={pickup} />
          <ItemsCard pickup={pickup} />
        </div>
        <div className="flex flex-col gap-4">
          <PeopleCard pickup={pickup} />
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Call-centre offers</CardTitle>
                <CardDescription>
                  Collectors this pickup was offered to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OfferHistory assignments={history} />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <PickupTimeline pickup={pickup} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold">{children}</dd>
    </div>
  );
}

function SummaryCard({ pickup }: { pickup: PickupDetail }) {
  const weighed = pickup.actualWeightKg;
  const difference = weighed === null ? null : weighed - pickup.estimatedKg;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>
          {pickup.area} · {pickupSourceLabels[pickup.source]}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fact label="Scheduled">
            {formatWeekdayDate(pickup.windowStart)}
            <span className="block text-xs font-normal text-muted-foreground">
              {formatTimeWindow(pickup.windowStart, pickup.windowEnd)}
            </span>
          </Fact>
          <Fact label="Customer's estimate">
            {formatWeight(pickup.estimatedKg, 1)}
            <span className="block text-xs font-normal text-muted-foreground">
              {pickup.bagCount} bag{pickup.bagCount === 1 ? "" : "s"}
              {pickup.itemCount !== null ? ` · ${pickup.itemCount} items` : ""}
            </span>
          </Fact>
          <Fact label="Weighed">
            {weighed === null ? (
              <span className="font-normal text-muted-foreground">Not yet</span>
            ) : (
              <>
                {formatWeight(weighed)}
                {difference !== null && Math.abs(difference) >= 0.01 && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {difference > 0 ? "+" : "−"}
                    {formatWeight(Math.abs(difference))} vs estimate
                  </span>
                )}
              </>
            )}
          </Fact>
          <Fact label="Hub">
            {pickup.hub?.name ?? (
              <span className="font-normal text-muted-foreground">—</span>
            )}
          </Fact>
        </dl>

        <div className="grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Customer earns ·{" "}
              {formatMoney(pickup.customerRatePerKgCents, { decimals: false })}
              /kg
            </span>
            <span className="font-heading text-xl font-bold">
              {pickup.customerPayoutCents === null
                ? "After weighing"
                : formatMoney(pickup.customerPayoutCents)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Collector earns ·{" "}
              {formatMoney(pickup.collectorRatePerKgCents, { decimals: false })}
              /kg
            </span>
            <span className="font-heading text-xl font-bold">
              {pickup.collectorPayoutCents === null
                ? "After weighing"
                : formatMoney(pickup.collectorPayoutCents)}
            </span>
          </div>
        </div>

        {pickup.note && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Note for the collector
            </span>
            <p className="text-sm">{pickup.note}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ItemsCard({ pickup }: { pickup: PickupDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
        <CardDescription>As the customer described them</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {pickup.items.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-4 py-2.5"
            >
              <span className="text-sm font-medium">
                {item.quantity !== null && (
                  <span className="mr-1 text-muted-foreground tabular-nums">
                    {item.quantity}×
                  </span>
                )}
                {item.name}
                {item.size && (
                  <span className="text-muted-foreground"> · {item.size}</span>
                )}
              </span>
              <StatusPill
                tone={
                  item.condition === "good"
                    ? "success"
                    : item.condition === "fair"
                      ? "neutral"
                      : "warning"
                }
              >
                {item.condition[0]!.toUpperCase() + item.condition.slice(1)}
              </StatusPill>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PeopleCard({ pickup }: { pickup: PickupDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{pickup.customer.name}</span>
          <span className="text-sm text-muted-foreground">
            {pickup.address}
          </span>
          <Button variant="outline" size="sm" className="mt-2 w-fit" asChild>
            <a href={`tel:${pickup.customer.mobile}`}>
              <Phone />
              {formatLkMobile(pickup.customer.mobile)}
            </a>
          </Button>
        </div>
        <div className="flex flex-col gap-1 border-t pt-4">
          <span className="text-xs font-medium text-muted-foreground">
            Collector
          </span>
          {pickup.collector ? (
            <>
              <span className="font-semibold">
                {pickup.collector.name}{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {pickup.collector.code}
                </span>
              </span>
              <span className="text-sm text-muted-foreground">
                {pickup.collector.vehiclePlate}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-fit"
                asChild
              >
                <a href={`tel:${pickup.collector.mobile}`}>
                  <Phone />
                  {formatLkMobile(pickup.collector.mobile)}
                </a>
              </Button>
            </>
          ) : (
            <span className="text-sm font-semibold text-warning">
              {pickup.status === "pending" ? "Not assigned yet" : "—"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Online collectors for the assign dialog, from the live dispatch data. */
async function candidatesFor(pickup: PickupDetail): Promise<Candidate[]> {
  const dispatch = await getDispatchRepository().getDispatch();
  return dispatch.ok ? rankCandidates(dispatch.data, pickup) : [];
}
