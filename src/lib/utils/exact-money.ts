/** EUR persistence arithmetic. Reject invalid values and fractional cents. */
export function moneyToMinorUnits(value: string | number): bigint {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid money amount');
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw new Error('Money amount must have at most two decimal places');
  const cents = BigInt(match[2]!) * BigInt(100) + BigInt((match[3] ?? '').padEnd(2, '0'));
  return match[1] ? -cents : cents;
}

export function minorUnitsToMoney(value: bigint): string {
  const absolute = value < BigInt(0) ? -value : value;
  return `${value < BigInt(0) ? '-' : ''}${absolute / BigInt(100)}.${String(absolute % BigInt(100)).padStart(2, '0')}`;
}

/** Compatibility presentation boundary. Never use this result for persisted deltas. */
export function minorUnitsToPresentation(value: bigint): number {
  if (!Number.isSafeInteger(Number(value)))
    throw new Error('Amount exceeds presentation precision');
  return Number(minorUnitsToMoney(value));
}
