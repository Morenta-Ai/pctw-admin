import { describe, expect, it } from "vitest";

import { DispatchMockSource } from "@/features/dispatch/data/dispatch-mock-source";
import { dispatchSchema } from "@/features/dispatch/data/models";
import { resetMockWorld } from "@/mock/mock-world";

const now = new Date("2026-11-07T06:00:00Z");

async function dispatchAt(at: Date) {
  const source = new DispatchMockSource(resetMockWorld(now), () => at);
  return dispatchSchema.parse(await source.getDispatch());
}

describe("dispatch mock source", () => {
  it("lists active collectors and today's open pickups", async () => {
    const dispatch = await dispatchAt(now);

    expect(dispatch.collectors).toHaveLength(11);
    expect(dispatch.collectors.filter((c) => c.online)).toHaveLength(7);
    expect(dispatch.pickups.map((p) => p.id).sort()).toEqual([
      "RT-24817",
      "RT-24819",
      "RT-24822",
      "RT-24826",
      "RT-24830",
      "RT-24835",
      "RT-24841",
      "RT-24844",
    ]);
    expect(dispatch.hubs).toHaveLength(2);
  });

  it("reports Ruwan's load and active pickup", async () => {
    const ruwan = (await dispatchAt(now)).collectors.find(
      (c) => c.code === "COL-0457",
    );

    expect(ruwan).toMatchObject({ loadKg: 20.5, activePickupId: "RT-24817" });
  });

  it("moves online collectors between polls but not offline ones", async () => {
    const first = await dispatchAt(now);
    const later = await dispatchAt(new Date(now.getTime() + 60_000));
    const position = (d: typeof first, code: string) => {
      const c = d.collectors.find((x) => x.code === code)!;
      return [c.latitude, c.longitude];
    };

    expect(position(later, "COL-0312")).not.toEqual(
      position(first, "COL-0312"),
    );
    expect(position(later, "COL-0473")).toEqual(position(first, "COL-0473"));
  });
});
