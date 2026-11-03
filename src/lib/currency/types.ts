export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
export type Currency = (typeof CURRENCIES)[number];
export const BASE_CURRENCY: Currency = 'EUR';
export type ExchangeRate = { date: string; base: string; quote: string; rate: number };
export type CurrencySnapshot = {
  currency: Currency;
  rates: Partial<Record<Currency, ExchangeRate>>;
};
export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && CURRENCIES.includes(value as Currency);
}
