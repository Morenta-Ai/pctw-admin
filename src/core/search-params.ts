/** Search params as Next passes them to a page. */
export type SearchParams = Record<string, string | string[] | undefined>;

/** The first value of a param, if any. */
export const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** Every param as a single string, for zod parsing. */
export function flatParams(
  params: SearchParams,
): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      firstParam(value) || undefined,
    ]),
  );
}
