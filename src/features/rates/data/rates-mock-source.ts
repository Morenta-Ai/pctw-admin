import "server-only";

import { ApiError } from "@/core/api/api-error";
import { colomboDateKey } from "@/core/time";
import {
  isMoneyUnit,
  type ImpactKey,
  type ImpactUnit,
  type Multipliers,
  type MultipliersInput,
  type NewRatesInput,
  type Rates,
} from "@/features/rates/data/models";
import type { RatesSource } from "@/features/rates/data/rates-source";
import { mockLatency, type MockWorld } from "@/mock/mock-world";

const invalid = (field: string, message: string) =>
  new ApiError({
    code: "VALIDATION_FAILED",
    message,
    status: 422,
    details: { [field]: message },
  });

export class RatesMockSource implements RatesSource {
  constructor(
    private readonly world: MockWorld,
    private readonly getAccessToken: () => Promise<string | undefined>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getRates(): Promise<Rates> {
    await mockLatency();
    return this.ratesView();
  }

  async setRates(input: NewRatesInput): Promise<Rates> {
    await mockLatency(300);
    const today = colomboDateKey(this.now());
    if (input.effectiveFrom < today) {
      throw invalid("effectiveFrom", "Choose today or a later date.");
    }
    if (input.collectorRatePerKgCents > input.customerRatePerKgCents) {
      throw invalid(
        "collectorRatePerKgCents",
        "The collector rate can't be more than the customer rate.",
      );
    }
    const staff = this.world.staffForToken(await this.getAccessToken());
    // A new future change replaces any change already scheduled.
    this.world.rateSets = this.world.rateSets.filter(
      (r) => r.effectiveFrom <= today,
    );
    this.world.rateSets.push({
      ...input,
      id: this.world.nextId("rate"),
      createdAt: this.now().toISOString(),
      createdBy: staff?.name ?? "Admin",
    });
    return this.ratesView();
  }

  async cancelScheduled(): Promise<Rates> {
    await mockLatency();
    const today = colomboDateKey(this.now());
    if (!this.world.rateSets.some((r) => r.effectiveFrom > today)) {
      throw new ApiError({
        code: "NO_SCHEDULED_RATES",
        message: "There's no scheduled change.",
        status: 404,
      });
    }
    this.world.rateSets = this.world.rateSets.filter(
      (r) => r.effectiveFrom <= today,
    );
    return this.ratesView();
  }

  async getMultipliers(): Promise<Multipliers> {
    await mockLatency();
    return this.multipliersView();
  }

  async updateMultipliers(input: MultipliersInput): Promise<Multipliers> {
    await mockLatency(300);
    for (const { key, perKg } of input.items) {
      const multiplier = this.world.multipliers.find((m) => m.key === key);
      if (!multiplier) throw invalid(key, `Unknown metric ${key}.`);
      if (perKg < 0) throw invalid(key, "Can't be negative.");
      if (
        isMoneyUnit(multiplier.unit as ImpactUnit) &&
        !Number.isInteger(perKg)
      ) {
        throw invalid(key, "Money factors must be whole cents.");
      }
    }
    for (const { key, perKg } of input.items) {
      this.world.multipliers.find((m) => m.key === key)!.perKg = perKg;
    }
    const staff = this.world.staffForToken(await this.getAccessToken());
    this.world.multipliersUpdated = {
      at: this.now().toISOString(),
      by: staff?.name ?? "Admin",
    };
    return this.multipliersView();
  }

  /** Splits the rate sets into current, scheduled and history as of today. */
  private ratesView(): Rates {
    const today = colomboDateKey(this.now());
    const sorted = [...this.world.rateSets].sort(
      (a, b) =>
        b.effectiveFrom.localeCompare(a.effectiveFrom) ||
        b.createdAt.localeCompare(a.createdAt),
    );
    const inForce = sorted.filter((r) => r.effectiveFrom <= today);
    const current = inForce[0]!;
    // Keep the world's rates in step, as the API would for new pickups.
    this.world.rates = current;
    return {
      current,
      scheduled: sorted.find((r) => r.effectiveFrom > today) ?? null,
      history: inForce.slice(1),
    };
  }

  private multipliersView(): Multipliers {
    return {
      items: this.world.multipliers.map((m) => ({
        key: m.key as ImpactKey,
        unit: m.unit as ImpactUnit,
        perKg: m.perKg,
      })),
      updatedAt: this.world.multipliersUpdated.at,
      updatedBy: this.world.multipliersUpdated.by,
    };
  }
}
