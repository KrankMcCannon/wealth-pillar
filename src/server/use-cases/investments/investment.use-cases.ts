import { InvestmentRepository } from '@/server/repositories/investment.repository';
import { MarketDataRepository } from '@/server/repositories/market-data.repository';
import { investments } from '@/server/db/schema';
import { buildSeriesIndex } from '@/lib/types/market-data.types';
import { getBatchMarketDataUseCase } from '../market-data/market-data.use-cases';
import {
  batchResultsToSeriesIndex,
  buildPortfolioHistory,
  enrichPortfolioFromInvestments,
} from './investment.portfolio.logic';
import type {
  InvestmentInsert,
  InvestmentsOverviewResult,
  PortfolioResult,
} from './investment.types';

export type {
  EnrichedInvestment,
  PortfolioSummary,
  AssetAllocationSlice,
  PortfolioResult,
  InvestmentsOverviewResult,
  InvestmentInsert,
} from './investment.types';

export async function getInvestmentsOverviewUseCase(
  userIds: string | string[]
): Promise<InvestmentsOverviewResult> {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const rows =
    ids.length === 1 && ids[0]
      ? await InvestmentRepository.findByUser(ids[0])
      : await InvestmentRepository.findByUsers(ids);
  if (rows.length === 0) {
    return {
      investments: [],
      summary: {
        totalInvested: 0,
        totalTaxPaid: 0,
        totalPaid: 0,
        totalCurrentValue: 0,
        totalInitialValue: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
      },
      assetAllocation: [],
      portfolioHistory: [],
    };
  }

  const symbols = [...new Set(rows.map((inv) => inv.symbol.toUpperCase()))];
  const batch = await getBatchMarketDataUseCase(symbols);
  const seriesIndex = batchResultsToSeriesIndex(batch);

  const portfolio = enrichPortfolioFromInvestments(rows, seriesIndex);
  const portfolioHistory = buildPortfolioHistory(rows, seriesIndex);

  return {
    ...portfolio,
    portfolioHistory,
  };
}

export async function getPortfolioUseCase(userId: string): Promise<PortfolioResult> {
  const rows = await InvestmentRepository.findByUser(userId);
  const symbols = [...new Set(rows.map((inv) => inv.symbol.toUpperCase()))];

  const seriesRows = await MarketDataRepository.findBySymbols(symbols);
  const seriesIndex = buildSeriesIndex(seriesRows);

  return enrichPortfolioFromInvestments(rows, seriesIndex);
}

export async function addInvestmentUseCase(data: InvestmentInsert) {
  const depositData = {
    ...data,
    amount: data.amount?.toString(),
    shares_acquired: data.shares_acquired?.toString(),
    currency_rate: data.currency_rate?.toString(),
    tax_paid: data.tax_paid?.toString(),
    net_earn: data.net_earn?.toString(),
  } as typeof investments.$inferInsert;

  return await InvestmentRepository.create(depositData);
}

export async function deleteInvestmentUseCase(id: string) {
  return await InvestmentRepository.delete(id);
}

export async function updateInvestmentUseCase(
  id: string,
  userId: string,
  data: Partial<InvestmentInsert>
) {
  const existing = await InvestmentRepository.findByIdAndUser(id, userId);
  if (!existing) throw new Error('Investment not found');

  const updateData = {
    ...data,
    amount: data.amount?.toString(),
    shares_acquired: data.shares_acquired?.toString(),
    currency_rate: data.currency_rate?.toString(),
    tax_paid: data.tax_paid?.toString(),
    net_earn: data.net_earn?.toString(),
  } as Partial<typeof investments.$inferInsert>;

  return await InvestmentRepository.update(id, updateData);
}

export async function getInvestmentByIdForUserUseCase(id: string, userId: string) {
  return await InvestmentRepository.findByIdAndUser(id, userId);
}
