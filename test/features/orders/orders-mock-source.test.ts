import { beforeEach, describe, expect, it } from "vitest";

import { nextStatuses } from "@/features/orders/data/order-status";
import { OrdersMockSource } from "@/features/orders/data/orders-mock-source";
import {
  createOrdersRepository,
  type OrdersRepository,
} from "@/features/orders/data/orders-repository";
import { resetMockWorld } from "@/mock/mock-world";

const now = new Date("2026-11-07T06:00:00Z");
let repo: OrdersRepository;

beforeEach(() => {
  repo = createOrdersRepository(
    new OrdersMockSource(
      resetMockWorld(now),
      async () => "mock.stf_2.access.1",
      () => now,
    ),
  );
});

describe("nextStatuses", () => {
  it("follows the fulfilment type after confirmation", () => {
    expect(nextStatuses("placed", "homeDelivery")).toEqual([
      "confirmed",
      "cancelled",
    ]);
    expect(nextStatuses("confirmed", "homeDelivery")[0]).toBe("outForDelivery");
    expect(nextStatuses("confirmed", "clickAndCollect")[0]).toBe(
      "readyAtVendor",
    );
    expect(nextStatuses("completed", "homeDelivery")).toEqual([]);
  });
});

describe("orders mock source", () => {
  it("lists new orders newest first", async () => {
    const result = await repo.list({ status: "placed" });

    expect(result.ok && result.data.items.map((o) => o.id)).toEqual([
      "ORD-5134",
      "ORD-5133",
    ]);
  });

  it("finds orders by customer name or waybill", async () => {
    const byName = await repo.list({ q: "dinesh" });
    expect(byName.ok && byName.data.items[0]?.id).toBe("ORD-5134");

    const confirmed = await repo.list({ status: "confirmed" });
    const waybill = confirmed.ok
      ? confirmed.data.items[0]?.waybillNumber
      : null;
    expect(waybill).toMatch(/^WB-\d{6}-\d{4}$/);
    const byWaybill = await repo.list({ q: waybill!.toLowerCase() });
    expect(byWaybill.ok && byWaybill.data.totalCount).toBe(1);
  });

  it("confirms an order, issuing the next waybill number", async () => {
    const result = await repo.setStatus("ORD-5134", "confirmed");

    expect(result).toMatchObject({ ok: true, data: { status: "confirmed" } });
    if (result.ok) {
      expect(result.data.waybillNumber).toMatch(/^WB-261107-\d{4}$/);
      expect(result.data.timeline.at(-1)).toMatchObject({
        status: "confirmed",
        actor: "Kasun Jayawardena",
      });
    }
  });

  it("walks a click & collect order through to completed", async () => {
    await repo.setStatus("ORD-5133", "confirmed");
    await repo.setStatus("ORD-5133", "readyAtVendor");
    const done = await repo.setStatus("ORD-5133", "completed");

    expect(done.ok && done.data.timeline.map((e) => e.status)).toEqual([
      "placed",
      "confirmed",
      "readyAtVendor",
      "completed",
    ]);
  });

  it("refuses moves that don't follow the flow", async () => {
    expect(await repo.setStatus("ORD-5134", "completed")).toMatchObject({
      ok: false,
      error: { code: "ORDER_STATUS_CHANGED", status: 409 },
    });
    expect(await repo.setStatus("ORD-5133", "outForDelivery")).toMatchObject({
      ok: false,
    });
  });
});
