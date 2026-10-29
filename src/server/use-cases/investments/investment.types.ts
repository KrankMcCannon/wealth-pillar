import type { investments } from '@/server/db/schema';
import type { Database } from '@/lib/types/database.types';

type Investment = typeof investments.$inferSelect;

export interface EnrichedInvestment extends Omit<
  Investment,
  'amount' | 'shares_acquired' | 'currency_rate' | 'tax_paid' | 'net_earn'
> {
  amount: number;
  shares_acquired: number;
  currency_rate: number;
  tax_paid: number;
  net_earn: number;
  priceDate: string | null;
  currentPrice: number | null;
  currentValue: number | null;
  initialValue: number | null;
  totalPaid: number;
  totalGain: number | null;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalTaxPaid: number;
  totalPaid: number;
  totalCurrentValue: number | null;
  totalInitialValue: number | null;
  totalReturn: number | null;
  totalReturnPercent: number | null;
}

export interface AssetAllocationSlice {
  symbol: string;
  value: number;
}

export interface PortfolioResult {
  investments: EnrichedInvestment[];
  summary: PortfolioSummary;
  assetAllocation: AssetAllocationSlice[];
}

export interface InvestmentsOverviewResult extends PortfolioResult {
  portfolioHistory: { date: string; value: number }[];
  marketDataUpdatedAt: string | null;
}

export type InvestmentInsert = Database['public']['Tables']['investments']['Insert'];

export interface InvestmentListItem {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  shares_acquired: number;
  currency: string;
  tax_paid?: number;
  totalPaid?: number;
  net_earn?: number;
  priceDate?: string | null;
  currentPrice?: number | null;
  currentValue?: number | null;
  totalGain?: number | null;
  created_at: Date | string | null;
}
