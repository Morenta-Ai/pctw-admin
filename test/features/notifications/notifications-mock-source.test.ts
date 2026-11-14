import { beforeEach, describe, expect, it } from "vitest";

import {
  notificationHref,
  notificationPageSchema,
} from "@/features/notifications/data/models";
import { NotificationsMockSource } from "@/features/notifications/data/notifications-mock-source";
import {
  createNotificationsRepository,
  type NotificationsRepository,
} from "@/features/notifications/data/notifications-repository";
import { resetMockWorld } from "@/mock/mock-world";

const now = new Date("2026-11-07T06:00:00Z");
let token = "mock.stf_2.access.1";
let repo: NotificationsRepository;

beforeEach(() => {
  token = "mock.stf_2.access.1";
  repo = createNotificationsRepository(
    new NotificationsMockSource(
      resetMockWorld(now),
      async () => token,
      () => now,
    ),
  );
});

async function list(query = {}) {
  const result = await repo.list(query);
  if (!result.ok) throw result.error;
  return notificationPageSchema.parse(result.data);
}

describe("notifications mock source", () => {
  it("alerts on waiting pickups, new orders and transfers, newest first", async () => {
    const page = await list({ limit: 50 });
    const ids = page.items.map((n) => n.id);

    expect(ids).toContain("ntf_pickupWaiting_RT-24841");
    expect(ids).toContain("ntf_orderPlaced_ORD-5134");
    expect(ids).toContain("ntf_transferRequested_red_3");
    const times = page.items.map((n) => n.createdAt);
    expect([...times].sort().reverse()).toEqual(times);
    expect(page.unreadCount).toBe(page.items.length);
  });

  it("pages with a cursor", async () => {
    const first = await list({ limit: 3 });
    const second = await list({ limit: 3, cursor: first.nextCursor! });

    expect(first.items).toHaveLength(3);
    expect(second.items[0]!.createdAt < first.items[2]!.createdAt).toBe(true);
  });

  it("keeps read state per staff member", async () => {
    const { items, unreadCount } = await list();
    await repo.markRead(items[0]!.id);

    expect((await list()).unreadCount).toBe(unreadCount - 1);
    expect((await list({ unread: true })).items.map((n) => n.id)).not.toContain(
      items[0]!.id,
    );

    token = "mock.stf_1.access.1";
    expect((await list()).unreadCount).toBe(unreadCount);
  });

  it("marks everything read", async () => {
    await repo.markAllRead();
    expect((await list()).unreadCount).toBe(0);
  });
});

describe("notificationHref", () => {
  it("links to the subject", () => {
    expect(
      notificationHref({ type: "orderPlaced", subjectId: "ORD-5134" }),
    ).toBe("/orders/ORD-5134");
    expect(
      notificationHref({ type: "pickupWaiting", subjectId: "RT-24841" }),
    ).toBe("/pickups/RT-24841");
  });
});
