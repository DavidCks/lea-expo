/**
 * Converts URLSearchParams or a query string into a nested object
 * using dot notation (e.g., `latestCapRate.from=5.0` → `{ latestCapRate: { from: 5.0 } }`)
 *
 * @param {string | URLSearchParams} input - The query string or URLSearchParams instance
 * @returns {Record<string, unknown>} A nested object representation of the query params
 */
export function fromQueryParams(
  input: string | URLSearchParams,
): Record<string, unknown> {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const result: Record<string, unknown> = {};

  params.forEach((value, key) => {
    const keys = key.split(".");
    let current: Record<string, unknown> = result;

    for (let i = 0; i < keys.length; i++) {
      const part = keys[i];

      if (i === keys.length - 1) {
        // Convert numeric values if possible
        const parsedValue = isNaN(Number(value)) ? value : Number(value);
        current[part] = parsedValue;
      } else {
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
    }
  });

  return result;
}
