import "server-only";

import { getAccessToken, getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import { guard, type Result } from "@/core/result";
import type {
  Multipliers,
  MultipliersInput,
  NewRatesInput,
  Rates,
} from "@/features/rates/data/models";
import { RatesMockSource } from "@/features/rates/data/rates-mock-source";
import { RatesRemoteSource } from "@/features/rates/data/rates-remote-source";
import type { RatesSource } from "@/features/rates/data/rates-source";
import { getMockWorld } from "@/mock/mock-world";

export type RatesRepository = {
  getRates(): Promise<Result<Rates>>;
  setRates(input: NewRatesInput): Promise<Result<Rates>>;
  cancelScheduled(): Promise<Result<Rates>>;
  getMultipliers(): Promise<Result<Multipliers>>;
  updateMultipliers(input: MultipliersInput): Promise<Result<Multipliers>>;
};

export function createRatesRepository(source: RatesSource): RatesRepository {
  return {
    getRates: () => guard(() => source.getRates()),
    setRates: (input) => guard(() => source.setRates(input)),
    cancelScheduled: () => guard(() => source.cancelScheduled()),
    getMultipliers: () => guard(() => source.getMultipliers()),
    updateMultipliers: (input) => guard(() => source.updateMultipliers(input)),
  };
}

export function getRatesRepository(): RatesRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new RatesMockSource(getMockWorld(), getAccessToken)
    : new RatesRemoteSource(getApiClient());
  return createRatesRepository(source);
}
