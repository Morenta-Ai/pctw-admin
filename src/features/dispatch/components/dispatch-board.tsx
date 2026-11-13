"use client";

import { ExternalLink, Phone, Radio, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppMap } from "@/components/app/app-map/app-map";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatDistance,
  formatLkMobile,
  formatRelative,
  formatTimeWindow,
  formatWeekdayDate,
  formatWeight,
} from "@/core/format/format";
import {
  dispatchSchema,
  vehicleLabels,
  type Dispatch,
  type DispatchCollector,
  type DispatchPickup,
} from "@/features/dispatch/data/models";
import {
  isUrgent,
  mapLayers,
  markerId,
  nearestCollectors,
} from "@/features/dispatch/dispatch-view";
import {
  pickupStatusLabels,
  pickupStatusTones,
} from "@/features/pickups/data/pickup-status";
import { cn } from "@/lib/utils";

const POLL_MS = 10_000;

type Tab = "pickups" | "collectors";

/** The live map: a list on the left, the map on the right, polled every 10 s. */
export function DispatchBoard({
  initial,
  apiKey,
  mapId,
}: {
  initial: Dispatch;
  apiKey?: string;
  mapId?: string;
}) {
  const [dispatch, setDispatch] = useState(initial);
  const [stale, setStale] = useState(false);
  const [tab, setTab] = useState<Tab>("pickups");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showOffline, setShowOffline] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/dispatch", { cache: "no-store" });
        if (response.status === 401) {
          router.replace("/login?next=/dispatch");
          return;
        }
        if (!response.ok) throw new Error(String(response.status));
        const next = dispatchSchema.parse(await response.json());
        if (!cancelled) {
          setDispatch(next);
          setStale(false);
        }
      } catch {
        if (!cancelled) setStale(true);
      }
    };
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [router]);

  // Ages are measured against the server's clock, not the browser's.
  const now = useMemo(
    () => new Date(dispatch.generatedAt),
    [dispatch.generatedAt],
  );
  const layers = useMemo(
    () => mapLayers(dispatch, { showOffline, now }),
    [dispatch, showOffline, now],
  );

  const waiting = dispatch.pickups
    .filter((p) => p.status === "pending")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const inProgress = dispatch.pickups.filter((p) => p.status !== "pending");
  const collectors = [...dispatch.collectors].sort(
    (a, b) =>
      Number(b.online) - Number(a.online) || a.name.localeCompare(b.name),
  );
  const online = collectors.filter((c) => c.online).length;

  const selectedPickup = dispatch.pickups.find(
    (p) => markerId.pickup(p.id) === selectedId,
  );
  const selectedCollector = dispatch.collectors.find(
    (c) => markerId.collector(c.id) === selectedId,
  );
  const selectedHub = dispatch.hubs.find(
    (h) => markerId.hub(h.id) === selectedId,
  );

  const select = (id: string) => {
    setSelectedId((current) => (current === id ? null : id));
    if (id.startsWith("p:")) setTab("pickups");
    if (id.startsWith("c:")) setTab("collectors");
  };

  return (
    <div className="grid h-[calc(100svh-12rem)] min-h-[600px] overflow-hidden rounded-xl border bg-card lg:grid-cols-[22rem_1fr]">
      <aside className="flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-3 border-b p-3">
          <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
            <TabsList className="w-full">
              <TabsTrigger value="pickups">
                Pickups ({dispatch.pickups.length})
              </TabsTrigger>
              <TabsTrigger value="collectors">
                Collectors ({online}/{collectors.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium",
                stale ? "text-destructive" : "text-muted-foreground",
              )}
              aria-live="polite"
            >
              <Radio className={cn("size-3.5", !stale && "text-success")} />
              {stale
                ? "Connection lost, retrying"
                : "Live · updates every 10 s"}
            </span>
            <div className="flex items-center gap-2">
              <Switch
                id="show-offline"
                checked={showOffline}
                onCheckedChange={setShowOffline}
              />
              <Label htmlFor="show-offline" className="text-xs">
                Offline
              </Label>
            </div>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {tab === "pickups" ? (
            <div className="flex flex-col gap-4 p-3">
              <ListSection
                title={`Waiting for a collector (${waiting.length})`}
              >
                {waiting.length === 0 && (
                  <p className="px-2 text-sm text-muted-foreground">
                    Every pickup has a collector.
                  </p>
                )}
                {waiting.map((pickup) => (
                  <PickupRow
                    key={pickup.id}
                    pickup={pickup}
                    now={now}
                    selected={selectedId === markerId.pickup(pickup.id)}
                    onSelect={() => select(markerId.pickup(pickup.id))}
                  />
                ))}
              </ListSection>
              <ListSection title={`In progress (${inProgress.length})`}>
                {inProgress.map((pickup) => (
                  <PickupRow
                    key={pickup.id}
                    pickup={pickup}
                    now={now}
                    collectorName={
                      dispatch.collectors.find(
                        (c) => c.id === pickup.collectorId,
                      )?.name
                    }
                    selected={selectedId === markerId.pickup(pickup.id)}
                    onSelect={() => select(markerId.pickup(pickup.id))}
                  />
                ))}
              </ListSection>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-3">
              {collectors.map((collector) => (
                <CollectorRow
                  key={collector.id}
                  collector={collector}
                  now={now}
                  selected={selectedId === markerId.collector(collector.id)}
                  onSelect={() => select(markerId.collector(collector.id))}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      <div className="relative min-h-0">
        <AppMap
          apiKey={apiKey}
          mapId={mapId}
          markers={layers.markers}
          lines={layers.lines}
          selectedId={selectedId}
          onSelect={select}
        />
        <Legend />
        {(selectedPickup || selectedCollector || selectedHub) && (
          <div className="absolute top-3 left-3 z-40 w-80 max-w-[calc(100%-5rem)] rounded-xl border bg-card p-4 shadow-lg">
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-2"
              aria-label="Close"
              onClick={() => setSelectedId(null)}
            >
              <X />
            </Button>
            {selectedPickup && (
              <PickupPanel
                pickup={selectedPickup}
                dispatch={dispatch}
                now={now}
                onSelectCollector={(id) => select(markerId.collector(id))}
              />
            )}
            {selectedCollector && (
              <CollectorPanel
                collector={selectedCollector}
                now={now}
                onSelectPickup={(id) => select(markerId.pickup(id))}
              />
            )}
            {selectedHub && (
              <div className="flex flex-col gap-1 pr-6">
                <span className="font-semibold">{selectedHub.name}</span>
                <span className="text-sm text-muted-foreground">
                  Hub {selectedHub.code}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ListSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="px-2 font-sans text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function PickupRow({
  pickup,
  now,
  collectorName,
  selected,
  onSelect,
}: {
  pickup: DispatchPickup;
  now: Date;
  collectorName?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const urgent = isUrgent(pickup, now);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full flex-col gap-1 rounded-lg px-2 py-2 text-left hover:bg-muted",
        selected && "bg-secondary hover:bg-secondary",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-semibold">{pickup.id}</span>
        {pickup.status === "pending" ? (
          <span
            className={cn(
              "text-xs font-semibold",
              urgent ? "text-destructive" : "text-warning",
            )}
          >
            Waiting {formatRelative(pickup.createdAt, now).replace(" ago", "")}
          </span>
        ) : (
          <StatusPill tone={pickupStatusTones[pickup.status]}>
            {pickupStatusLabels[pickup.status]}
          </StatusPill>
        )}
      </span>
      <span className="text-xs text-muted-foreground">
        {pickup.area} · ~{formatWeight(pickup.estimatedKg, 1)} ·{" "}
        {formatTimeWindow(pickup.windowStart, pickup.windowEnd)}
        {collectorName ? ` · ${collectorName}` : ""}
      </span>
    </button>
  );
}

function CollectorRow({
  collector,
  now,
  selected,
  onSelect,
}: {
  collector: DispatchCollector;
  now: Date;
  selected: boolean;
  onSelect: () => void;
}) {
  const loadShare = Math.min(
    100,
    (collector.loadKg / collector.vehicle.capacityKg) * 100,
  );
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-lg px-2 py-2 text-left hover:bg-muted",
        selected && "bg-secondary hover:bg-secondary",
        !collector.online && "opacity-70",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">
          {collector.name}{" "}
          <span className="font-mono text-xs font-medium text-muted-foreground">
            {collector.code}
          </span>
        </span>
        {collector.online ? (
          <StatusPill tone={collector.activePickupId ? "cyan" : "lime"} dot>
            {collector.activePickupId ? "On a job" : "Available"}
          </StatusPill>
        ) : (
          <span className="text-xs text-muted-foreground">
            {formatRelative(collector.lastSeenAt, now)}
          </span>
        )}
      </span>
      <span className="flex items-center gap-2">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${loadShare}%` }}
          />
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatWeight(collector.loadKg, 1)} / {collector.vehicle.capacityKg}{" "}
          kg
        </span>
      </span>
    </button>
  );
}

function PickupPanel({
  pickup,
  dispatch,
  now,
  onSelectCollector,
}: {
  pickup: DispatchPickup;
  dispatch: Dispatch;
  now: Date;
  onSelectCollector: (id: string) => void;
}) {
  const collector = dispatch.collectors.find(
    (c) => c.id === pickup.collectorId,
  );
  const nearby =
    pickup.status === "pending" ? nearestCollectors(dispatch, pickup) : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 pr-6">
        <span className="flex items-center gap-2">
          <span className="font-mono font-semibold">{pickup.id}</span>
          <StatusPill tone={pickupStatusTones[pickup.status]}>
            {pickupStatusLabels[pickup.status]}
          </StatusPill>
        </span>
        <span className="text-sm">
          {pickup.customerName} · {pickup.area}
        </span>
        <span className="text-xs text-muted-foreground">
          ~{formatWeight(pickup.estimatedKg, 1)} ·{" "}
          {formatWeekdayDate(pickup.windowStart)}{" "}
          {formatTimeWindow(pickup.windowStart, pickup.windowEnd)} · booked{" "}
          {formatRelative(pickup.createdAt, now)}
        </span>
      </div>

      {collector && (
        <button
          type="button"
          className="rounded-lg bg-muted p-2 text-left text-sm hover:bg-secondary"
          onClick={() => onSelectCollector(collector.id)}
        >
          <span className="block text-xs text-muted-foreground">Collector</span>
          {collector.name} · {collector.code}
        </button>
      )}

      {pickup.status === "pending" && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted-foreground">
            Nearest available collectors
          </span>
          {nearby.length === 0 && (
            <span className="text-sm text-muted-foreground">
              No online collector has room for this pickup.
            </span>
          )}
          {nearby.map((c) => (
            <button
              key={c.id}
              type="button"
              className="-mx-1 flex items-center justify-between rounded-md px-1 py-1 text-left text-sm hover:bg-muted"
              onClick={() => onSelectCollector(c.id)}
            >
              <span>
                {c.name}{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {c.code}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistance(c.distanceKm)}
                {c.activePickupId ? " · on a job" : ""}
              </span>
            </button>
          ))}
        </div>
      )}

      <Button asChild variant="outline" size="sm">
        <Link href={`/pickups/${pickup.id}`}>
          <ExternalLink />
          Open pickup
        </Link>
      </Button>
    </div>
  );
}

function CollectorPanel({
  collector,
  now,
  onSelectPickup,
}: {
  collector: DispatchCollector;
  now: Date;
  onSelectPickup: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 pr-6">
        <span className="font-semibold">
          {collector.name}{" "}
          <span className="font-mono text-xs text-muted-foreground">
            {collector.code}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          {vehicleLabels[collector.vehicle.type]} · {collector.vehicle.plate} ·{" "}
          {collector.area}
        </span>
        <span className="text-xs text-muted-foreground">
          {collector.online
            ? "Online now"
            : `Offline · last seen ${formatRelative(collector.lastSeenAt, now)}`}
        </span>
      </div>
      <div className="rounded-lg bg-muted p-2 text-sm">
        <span className="block text-xs text-muted-foreground">Carrying</span>
        {formatWeight(collector.loadKg, 1)} of {collector.vehicle.capacityKg} kg
      </div>
      {collector.activePickupId && (
        <button
          type="button"
          className="rounded-lg bg-muted p-2 text-left text-sm hover:bg-secondary"
          onClick={() => onSelectPickup(collector.activePickupId!)}
        >
          <span className="block text-xs text-muted-foreground">
            Current job
          </span>
          <span className="font-mono">{collector.activePickupId}</span>
        </button>
      )}
      <Button asChild variant="outline" size="sm">
        <a href={`tel:${collector.mobile}`}>
          <Phone />
          {formatLkMobile(collector.mobile)}
        </a>
      </Button>
    </div>
  );
}

function Legend() {
  const items = [
    ["bg-warning", "Waiting"],
    ["bg-destructive", "Waiting 30+ min"],
    ["bg-cyan", "Assigned"],
    ["bg-primary", "Collector"],
  ] as const;
  return (
    <div className="absolute bottom-3 left-3 z-30 flex flex-wrap gap-3 rounded-md bg-card/90 px-3 py-1.5 text-[11px] font-medium">
      {items.map(([color, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-sm", color)} />
          {label}
        </span>
      ))}
    </div>
  );
}
