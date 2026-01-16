/**
 * Serializes Prisma objects for Client Components.
 * Converts Decimal to number.
 * Can be extended for other types.
 */
export function serialize<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'object') {
    // Handle Decimal via duck typing
    if (
      typeof (data as any).toNumber === 'function' &&
      typeof (data as any).toFixed === 'function'
    ) {
      return (data as any).toNumber() as T;
    }

    // Handle Date (optional, usually allowed for Server Actions but safer for props)
    // Leaving Date as Date for now unless strict JSON required. Next.js supports Date in server-client props.
    // However, the error said "Only plain objects". Decimal is the main culprit.

    // Handle Date - preserve it
    if (data instanceof Date) {
      return data as T;
    }

    // Handle Array
    if (Array.isArray(data)) {
      return data.map((item) => serialize(item)) as unknown as T;
    }

    // Handle Object
    const newObj: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newObj[key] = serialize((data as any)[key]);
      }
    }
    return newObj as T;
  }

  return data;
}
