/**
 * Converts a nested object into a flat URLSearchParams instance,
 * using dot notation for nested keys (e.g., `latestCapRate.from=5.0`).
 *
 * Skips any keys with `null`, `undefined` or array values.
 *
 * @param {Record<string, unknown>} obj - The input object to convert.
 * @param {string} [parentKey] - (Internal) Used for recursion to build nested keys.
 * @returns {URLSearchParams} A URLSearchParams object representing the flattened query parameters.
 *
 * @example
 * const params = {
 *   latestCapRate: { from: 5.0, to: 6.0 },
 *   latestAppraisal: { from: null, to: 1000000 }
 * };
 * const query = toQueryParams(params);
 * console.log(query.toString()); // "latestCapRate.from=5&latestCapRate.to=6&latestAppraisal.to=1000000"
 */
export function toQueryParams(
  obj: Record<string, unknown>,
  parentKey: string = "",
): URLSearchParams {
  const query = new URLSearchParams();

  for (const key in obj) {
    const value = obj[key];

    if (value !== null && value !== undefined) {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;

      if (Array.isArray(value)) {
        // Skip arrays (or alternatively, handle them here if desired)
        continue;
      }

      if (typeof value === "object") {
        const nested = value as Record<string, unknown>;
        const nestedParams = toQueryParams(nested, fullKey);
        nestedParams.forEach((v, k) => query.append(k, v));
      } else {
        query.append(fullKey, String(value));
      }
    }
  }

  return query;
}
