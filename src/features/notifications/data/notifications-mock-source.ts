import "server-only";

import { formatMoney } from "@/core/format/format";

import type {
  Notification,
  NotificationPage,
  NotificationQuery,
} from "@/features/notifications/data/models";
import type { NotificationsSource } from "@/features/notifications/data/notifications-source";
import { mockLatency, type MockWorld } from "@/mock/mock-world";

const WAITING_MS = 30 * 60_000;
/** How far back the mock generates alerts. */
const WINDOW_MS = 2 * 24 * 60 * 60_000;

type Alert = Omit<Notification, "read">;

/**
 * Derives the alerts the API would have sent from the MockWorld's events,
 * so they always agree with what the other pages show.
 */
export class NotificationsMockSource implements NotificationsSource {
  constructor(
    private readonly world: MockWorld,
    private readonly getAccessToken: () => Promise<string | undefined>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list({
    unread = false,
    limit = 20,
    cursor,
  }: NotificationQuery): Promise<NotificationPage> {
    await mockLatency(120);
    const reads = await this.reads();
    const all = this.alerts().map((alert) => ({
      ...alert,
      read: this.isRead(alert, reads),
    }));
    const unreadCount = all.filter((n) => !n.read).length;
    const filtered = all
      .filter((n) => !unread || !n.read)
      .filter((n) => !cursor || n.createdAt < cursor);
    const items = filtered.slice(0, Math.min(Math.max(limit, 1), 50));
    return {
      items,
      nextCursor:
        filtered.length > items.length
          ? (items.at(-1)?.createdAt ?? null)
          : null,
      unreadCount,
    };
  }

  async markRead(id: string) {
    await mockLatency(80);
    (await this.reads()).ids.add(id);
  }

  async markAllRead() {
    await mockLatency(80);
    const reads = await this.reads();
    reads.allBefore = this.now().toISOString();
    reads.ids.clear();
  }

  private async reads() {
    const staffId =
      this.world.staffForToken(await this.getAccessToken())?.id ?? "anonymous";
    let reads = this.world.notificationReads.get(staffId);
    if (!reads) {
      reads = { ids: new Set(), allBefore: null };
      this.world.notificationReads.set(staffId, reads);
    }
    return reads;
  }

  private isRead(
    alert: Alert,
    reads: { ids: Set<string>; allBefore: string | null },
  ) {
    return (
      reads.ids.has(alert.id) ||
      (reads.allBefore !== null && alert.createdAt <= reads.allBefore)
    );
  }

  private alerts(): Alert[] {
    const now = this.now();
    this.world.settleAssignments(now);
    const since = now.getTime() - WINDOW_MS;
    const recent = (iso: string) => {
      const t = Date.parse(iso);
      return t >= since && t <= now.getTime();
    };
    const alerts: Alert[] = [];

    for (const p of this.world.pickups) {
      if (recent(p.createdAt) && p.source === "app") {
        alerts.push({
          id: `ntf_pickupRequested_${p.id}`,
          type: "pickupRequested",
          title: `New pickup ${p.id}`,
          body: `${p.area} · about ${p.estimatedKg} kg`,
          subjectId: p.id,
          createdAt: p.createdAt,
        });
      }
      const waitingSince = Date.parse(p.createdAt) + WAITING_MS;
      if (
        p.status === "pending" &&
        waitingSince <= now.getTime() &&
        waitingSince >= since
      ) {
        alerts.push({
          id: `ntf_pickupWaiting_${p.id}`,
          type: "pickupWaiting",
          title: `${p.id} has waited 30 minutes`,
          body: `${p.area} · about ${p.estimatedKg} kg · no collector yet`,
          subjectId: p.id,
          createdAt: new Date(waitingSince).toISOString(),
        });
      }
    }

    for (const a of this.world.assignments) {
      if (
        (a.status === "declined" || a.status === "expired") &&
        a.respondedAt &&
        recent(a.respondedAt)
      ) {
        const c = this.world.collector(a.collectorId);
        const name = c ? `${c.firstName} ${c.lastName}` : "The collector";
        alerts.push({
          id: `ntf_offerDeclined_${a.id}`,
          type: "offerDeclined",
          title:
            a.status === "declined"
              ? `${name} declined ${a.pickupId}`
              : `No answer on ${a.pickupId}`,
          body:
            a.status === "declined"
              ? `Reason: ${a.declineReason ?? "none given"}. Offer it to someone else.`
              : `${name} didn't answer in 45 seconds. Offer it to someone else.`,
          subjectId: a.pickupId,
          createdAt: a.respondedAt,
        });
      }
    }

    for (const o of this.world.orders) {
      if (recent(o.createdAt)) {
        const c = this.world.customer(o.customerId);
        alerts.push({
          id: `ntf_orderPlaced_${o.id}`,
          type: "orderPlaced",
          title: `New order ${o.id}`,
          body: `${c?.firstName ?? "A customer"} · ${o.fulfilmentType === "homeDelivery" ? "home delivery" : "click & collect"}`,
          subjectId: o.id,
          createdAt: o.createdAt,
        });
      }
    }

    for (const r of this.world.redemptions) {
      if (r.type === "cash" && recent(r.requestedAt)) {
        const c = this.world.customer(r.customerId);
        alerts.push({
          id: `ntf_transferRequested_${r.id}`,
          type: "transferRequested",
          title: "Bank transfer requested",
          body: `${c ? `${c.firstName} ${c.lastName}` : "A customer"} · ${formatMoney(r.amountCents)}`,
          subjectId: r.id,
          createdAt: r.requestedAt,
        });
      }
    }

    return alerts.sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
    );
  }
}
