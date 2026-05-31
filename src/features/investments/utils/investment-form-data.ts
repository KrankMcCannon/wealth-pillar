import type { investments } from '@/server/db/schema';
import type { InvestmentFormData } from '../components/investment-form-fields';

type InvestmentRow = typeof investments.$inferSelect;

export function mapInvestmentToFormData(row: InvestmentRow): InvestmentFormData {
  const fallbackDay = new Date().toISOString().slice(0, 10);
  const dateStr =
    row.created_at === null
      ? fallbackDay
      : (row.created_at.toISOString().split('T')[0] ?? fallbackDay);
  const currency: 'EUR' | 'USD' = row.currency === 'USD' ? 'USD' : 'EUR';

  return {
    name: row.name,
    symbol: row.symbol,
    amount: String(row.amount),
    tax_paid: String(row.tax_paid ?? 0),
    shares: String(row.shares_acquired),
    currency,
    created_at: dateStr,
  };
}

export function buildInvestmentPayload(data: InvestmentFormData) {
  return {
    name: data.name,
    symbol: data.symbol.toUpperCase(),
    amount: Number(data.amount),
    shares_acquired: Number(data.shares),
    currency: data.currency,
    created_at: new Date(data.created_at),
    tax_paid: Number(data.tax_paid) || 0,
    currency_rate: 1,
    net_earn: 0,
  };
}
