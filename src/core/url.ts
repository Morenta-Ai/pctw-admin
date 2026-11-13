type ParamValue = string | number | null | undefined;

/**
 * `path?…` with `changes` applied to `current`. A null, undefined or empty
 * value removes the param. Used for filter, sort and page links.
 */
export function hrefWith(
  path: string,
  current: Record<string, string | string[] | undefined>,
  changes: Record<string, ParamValue>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (typeof value === "string" && value !== "") params.set(key, value);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
