import type {
  Multipliers,
  MultipliersInput,
  NewRatesInput,
  Rates,
} from "@/features/rates/data/models";

/** Talks to `/admin/rates` and `/admin/impact-multipliers`. Throws ApiError on failure. */
export type RatesSource = {
  getRates(): Promise<Rates>;
  setRates(input: NewRatesInput): Promise<Rates>;
  cancelScheduled(): Promise<Rates>;
  getMultipliers(): Promise<Multipliers>;
  updateMultipliers(input: MultipliersInput): Promise<Multipliers>;
};
