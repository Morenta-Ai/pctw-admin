import { describe, expect, it } from "vitest";

import { DispatchMockSource } from "@/features/dispatch/data/dispatch-mock-source";
import {
  isUrgent,
  mapLayers,
  markerId,
  nearestCollectors,
} from "@/features/dispatch/dispatch-view";
import { resetMockWorld } from "@/mock/mock-world";

const now = new Date("2026-11-07T06:00:00Z");

async function dispatch() {
  return new DispatchMockSource(resetMockWorld(now), () => now).getDispatch();
}

describe("dispatch view", () => {
  it("marks pickups pending over 30 minutes as urgent", async () => {
    const d = await dispatch();
    const byId = (id: string) => d.pickups.find((p) => p.id === id)!;

    expect(isUrgent(byId("RT-24841"), now)).toBe(true); // 42 min
    expect(isUrgent(byId("RT-24844"), now)).toBe(false); // 8 min
  });

  it("hides offline collectors unless asked, and draws trip lines", async () => {
    const d = await dispatch();

    const online = mapLayers(d, { showOffline: false, now });
    const all = mapLayers(d, { showOffline: true, now });

    const collectors = (m: typeof online) =>
      m.markers.filter((x) => x.kind.startsWith("collector")).length;
    expect(collectors(online)).toBe(7);
    expect(collectors(all)).toBe(11);
    expect(online.lines.map((l) => l.id)).toContain("col_457-RT-24817");
    expect(
      online.markers.find((m) => m.id === markerId.pickup("RT-24841"))?.kind,
    ).toBe("pendingUrgent");
  });

  it("suggests the nearest online collectors with room", async () => {
    const d = await dispatch();
    const pickup = d.pickups.find((p) => p.id === "RT-24841")!;

    const nearby = nearestCollectors(d, pickup);

    expect(nearby).toHaveLength(3);
    expect(nearby.every((c) => c.online)).toBe(true);
    expect(nearby[0]!.distanceKm).toBeLessThanOrEqual(nearby[1]!.distanceKm);
  });
});
