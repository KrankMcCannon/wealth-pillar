import { InvestmentRepository } from '@/server/repositories/investment.repository';
import { investments } from '@/server/db/schema';
import { getBatchMarketDataUseCase } from '../market-data/market-data.use-cases';
import {
  batchResultsToSeriesIndex,
  buildPortfolioHistoryWithSnapshots,
  enrichPortfolioFromInvestments,
} from './investment.portfolio.logic';
import { decodeInvestmentCursor, encodeInvestmentCursor } from '@/lib/utils/investment-cursor';
import type { InvestmentInsert, InvestmentsOverviewResult } from './investment.types';

export type {
  EnrichedInvestment,
  PortfolioSummary,
  AssetAllocationSlice,
  PortfolioResult,
  InvestmentsOverviewResult,
  InvestmentInsert,
} from './investment.types';

export const INVESTMENTS_LIST_PAGE_SIZE = 30;

type InvestmentRow = typeof investments.$inferSelect;

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

  const sqlTotals = await InvestmentRepository.getTotalsByUsers(ids);
  const symbols = [...new Set(rows.map((inv) => inv.symbol.toUpperCase()))];
  const batch = await getBatchMarketDataUseCase(symbols);
  const seriesIndex = batchResultsToSeriesIndex(batch);

  const portfolio = enrichPortfolioFromInvestments(rows, seriesIndex, {
    totalInvested: sqlTotals.totalInvested,
    totalTaxPaid: sqlTotals.totalTaxPaid,
  });
  const portfolioHistory = await buildPortfolioHistoryWithSnapshots(ids, rows, seriesIndex);

  return {
    ...portfolio,
    portfolioHistory,
  };
}

export async function fetchInvestmentsHoldingsWindow(
  userIds: string[],
  cursor?: string
): Promise<{ holdings: InvestmentRow[]; hasMore: boolean; nextCursor?: string }> {
  const decodedCursor = cursor?.trim() ? decodeInvestmentCursor(cursor.trim()) : undefined;
  const result = await InvestmentRepository.findByUsersKeyset({
    userIds,
    limit: INVESTMENTS_LIST_PAGE_SIZE,
    ...(decodedCursor
      ? { cursorAfter: { createdAt: decodedCursor.createdAt, id: decodedCursor.id } }
      : {}),
  });

  const last = result.data[result.data.length - 1];
  const nextCursor =
    result.hasMore && last
      ? encodeInvestmentCursor({ created_at: last.created_at, id: last.id })
      : undefined;

  return {
    holdings: result.data,
    hasMore: result.hasMore,
    ...(nextCursor ? { nextCursor } : {}),
  };
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

export function resolveInvestmentsTargetUserIds(
  currentUser: { id: string; role: string | null },
  groupUserIds: string[],
  selectedUser: string
): string[] {
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
  if (!isAdmin) return [currentUser.id];

  if (selectedUser !== 'all' && groupUserIds.includes(selectedUser)) {
    return [selectedUser];
  }

  return groupUserIds.length > 0 ? groupUserIds : [currentUser.id];
}
