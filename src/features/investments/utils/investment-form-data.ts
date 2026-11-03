import { isCurrency, type Currency } from '@/lib/currency/types';
import { financialDateKey } from '@/lib/utils/financial-date';
import { parseDecimal } from '@/lib/utils/parse-decimal';
import type { investments } from '@/server/db/schema';
import type { InvestmentFormData } from '../components/investment-form-fields';

type InvestmentRow = typeof investments.$inferSelect;

export function mapInvestmentToFormData(row: InvestmentRow): InvestmentFormData {
  const dateStr = financialDateKey(row.created_at ?? new Date());
  const currency: Currency = isCurrency(row.currency) ? row.currency : 'EUR';

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
    amount: parseDecimal(data.amount),
    shares_acquired: parseDecimal(data.shares, 10),
    currency: data.currency,
    created_at: data.created_at,
    tax_paid: parseDecimal(data.tax_paid) || 0,
    net_earn: 0,
  };
}
