import { addDays, colomboDateKey } from "@/core/time";
import {
  pickupQuerySchema,
  type PickupQuery,
} from "@/features/pickups/data/models";

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * The list query from the page's URL. `date=today` and `date=yesterday` are
 * Colombo days; anything invalid is ignored rather than erroring.
 */
export function pickupQueryFromParams(params: Params, now: Date): PickupQuery {
  const today = colomboDateKey(now);
  const rawDate = first(params.date);
  const date =
    rawDate === "today"
      ? today
      : rawDate === "yesterday"
        ? addDays(today, -1)
        : rawDate;

  return pickupQuerySchema.parse({
    status: first(params.status),
    source: first(params.source),
    date,
    q: first(params.q) || undefined,
    page: first(params.page),
    sort: first(params.sort),
  });
}
