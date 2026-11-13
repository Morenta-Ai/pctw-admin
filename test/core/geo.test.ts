import { describe, expect, it } from "vitest";

import { boundsOf, distanceKm } from "@/core/geo";

const dehiwala = { latitude: 6.8511, longitude: 79.8655 };
const wellawatte = { latitude: 6.8742, longitude: 79.8606 };

describe("distanceKm", () => {
  it("measures short Colombo hops to 1 decimal", () => {
    expect(distanceKm(dehiwala, wellawatte)).toBe(2.6);
    expect(distanceKm(dehiwala, dehiwala)).toBe(0);
  });
});

describe("boundsOf", () => {
  it("pads the box around the points", () => {
    const bounds = boundsOf([dehiwala, wellawatte], 0.5)!;
    expect(bounds.north).toBeGreaterThan(wellawatte.latitude);
    expect(bounds.south).toBeLessThan(dehiwala.latitude);
    expect(bounds.west).toBeLessThan(wellawatte.longitude);
  });

  it("gives a single point some size, and nothing for no points", () => {
    const bounds = boundsOf([dehiwala])!;
    expect(bounds.north - bounds.south).toBeCloseTo(0.01);
    expect(boundsOf([])).toBeNull();
  });
});
