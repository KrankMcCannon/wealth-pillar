/**
 * Serializes Prisma objects for Client Components.
 * Converts Decimal to number.
 * Can be extended for other types.
 */

/** Type guard for Decimal-like objects */
function isDecimalLike(value: unknown): value is { toNumber: () => number; toFixed: () => string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as Record<string, unknown>).toNumber === 'function' &&
    'toFixed' in value &&
    typeof (value as Record<string, unknown>).toFixed === 'function'
  );
}

export function serialize<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'object') {
    // Handle Decimal via duck typing
    if (isDecimalLike(data)) {
      return data.toNumber() as T;
    }

    // Handle Date - preserve it
    if (data instanceof Date) {
      return data as T;
    }

    // Handle Array
    if (Array.isArray(data)) {
      return data.map((item) => serialize(item)) as unknown as T;
    }

    // Handle Object
    const newObj: Record<string, unknown> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newObj[key] = serialize((data as Record<string, unknown>)[key]);
      }
    }
    return newObj as T;
  }

  return data;
}
