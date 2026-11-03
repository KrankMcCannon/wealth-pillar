import { financialDateKey } from '@/lib/utils/financial-date';
import { parseDecimal } from '@/lib/utils/parse-decimal';
import type { investments } from '@/server/db/schema';
import type { InvestmentFormData } from '../components/investment-form-fields';

type InvestmentRow = typeof investments.$inferSelect;

export function mapInvestmentToFormData(row: InvestmentRow): InvestmentFormData {
  const dateStr = financialDateKey(row.created_at ?? new Date());
  const currency: 'EUR' | 'USD' = row.currency === 'USD' ? 'USD' : 'EUR';

  return {
    name: row.name,
    symbol: row.symbol,
    amount: String(row.amount),
    tax_paid: String(row.tax_paid ?? 0),
    shares: String(row.shares_acquired),
    currency,
    currency_rate: currency === 'USD' ? String(row.currency_rate) : '',
    created_at: dateStr,
  };
}

export function buildInvestmentPayload(data: InvestmentFormData) {
  return {
    name: data.name,
    symbol: data.symbol.toUpperCase(),
    amount: parseDecimal(data.amount),
    shares_acquired: parseDecimal(data.shares, 10),
    currency: data.currency,
    created_at: data.created_at,
    tax_paid: parseDecimal(data.tax_paid) || 0,
    currency_rate: data.currency === 'EUR' ? 1 : parseDecimal(data.currency_rate ?? '', 6),
    net_earn: 0,
  };
}
