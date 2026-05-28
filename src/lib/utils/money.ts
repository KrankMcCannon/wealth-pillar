/** Round monetary amounts to 2 decimal places (avoids float drift). */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
