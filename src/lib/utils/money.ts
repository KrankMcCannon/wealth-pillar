/** Round monetary amounts to 2 decimal places (avoids float drift). */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** ponytail: amounts stay number at DB; classifier works in integer cents; upgrade path is numeric→bigint minor units. */
export function toCents(amount: number): number {
  return Math.round((Number(amount) || 0) * 100);
}

export function fromCents(cents: number): number {
  return roundMoney(cents / 100);
}
