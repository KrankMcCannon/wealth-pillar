import Decimal from 'decimal.js';

/** Enough headroom for database quantity/rate scales and large aggregate totals. */
export const FinancialDecimal = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
export function financialDecimal(value: Decimal.Value) {
  const amount = new FinancialDecimal(value);
  if (!amount.isFinite()) throw new Error('Invalid financial decimal');
  return amount;
}
