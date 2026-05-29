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
  currentPrice: number;
  currentValue: number;
  initialValue: number;
  totalPaid: number;
  totalGain: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalTaxPaid: number;
  totalPaid: number;
  totalCurrentValue: number;
  totalInitialValue: number;
  totalReturn: number;
  totalReturnPercent: number;
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
}

export type InvestmentInsert = Database['public']['Tables']['investments']['Insert'];
