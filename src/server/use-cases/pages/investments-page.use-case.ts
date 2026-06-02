import { cacheLife, cacheTag } from 'next/cache';
import type { User } from '@/lib/types';
import type { TimeSeriesEntry } from '@/lib/types/market-data.types';
import { withTimeout } from '@/lib/utils/with-timeout';
import { getMarketDataUseCase } from '../market-data/market-data.use-cases';
import {
  fetchInvestmentsHoldingsWindow,
  getInvestmentsOverviewUseCase,
  resolveInvestmentsTargetUserIds,
} from '../investments/investment.use-cases';
import type {
  AssetAllocationSlice,
  InvestmentListItem,
  PortfolioSummary,
} from '../investments/investment.types';
import { scopeInvestmentsPageData } from '@/server/permissions/scope-page-data';

export interface InvestmentsPageQuery {
  user?: string;
  index?: string;
}

export interface InvestmentsPageData {
  summary: PortfolioSummary;
  assetAllocation: AssetAllocationSlice[];
  portfolioHistory: { date: string; value: number }[];
  indexData: TimeSeriesEntry[];
  currentIndex: string;
  holdings: InvestmentListItem[];
  hasMore: boolean;
  nextCursor?: string;
  userScope: string;
}

function mapHoldingsToInvestment(
  rows: Awaited<ReturnType<typeof fetchInvestmentsHoldingsWindow>>['holdings']
): InvestmentListItem[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    amount: Number(row.amount),
    shares_acquired: Number(row.shares_acquired),
    currency: row.currency,
    tax_paid: Number(row.tax_paid),
    totalPaid: Number(row.amount) + (Number(row.tax_paid) || 0),
    net_earn: Number(row.net_earn),
    created_at: row.created_at,
  }));
}

async function getCachedInvestmentsPageData(
  groupId: string,
  targetUserIds: string[],
  indexSymbol: string,
  userScope: string
): Promise<InvestmentsPageData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`group:${groupId}:investments`);

  const [overview, holdingsWindow, indexData] = await Promise.all([
    getInvestmentsOverviewUseCase(targetUserIds),
    fetchInvestmentsHoldingsWindow(targetUserIds),
    withTimeout(getMarketDataUseCase(indexSymbol), 1500, [] as TimeSeriesEntry[]),
  ]);

  return {
    summary: overview.summary,
    assetAllocation: overview.assetAllocation,
    portfolioHistory: overview.portfolioHistory,
    indexData,
    currentIndex: indexSymbol,
    holdings: mapHoldingsToInvestment(holdingsWindow.holdings),
    hasMore: holdingsWindow.hasMore,
    ...(holdingsWindow.nextCursor ? { nextCursor: holdingsWindow.nextCursor } : {}),
    userScope,
  };
}

export async function getInvestmentsPageData(
  groupId: string,
  query: InvestmentsPageQuery,
  currentUser: User,
  groupUserIds: string[]
): Promise<InvestmentsPageData> {
  const userScope = query.user?.trim() || 'all';
  const indexSymbol = query.index?.trim().toUpperCase() || 'IVV';
  const targetUserIds = resolveInvestmentsTargetUserIds(currentUser, groupUserIds, userScope);

  const data = await getCachedInvestmentsPageData(groupId, targetUserIds, indexSymbol, userScope);

  return scopeInvestmentsPageData(data, currentUser);
}

export async function fetchInvestmentsPageWindow(
  targetUserIds: string[],
  cursor: string
): Promise<{ holdings: InvestmentListItem[]; hasMore: boolean; nextCursor?: string }> {
  const window = await fetchInvestmentsHoldingsWindow(targetUserIds, cursor);
  return {
    holdings: mapHoldingsToInvestment(window.holdings),
    hasMore: window.hasMore,
    ...(window.nextCursor ? { nextCursor: window.nextCursor } : {}),
  };
}
