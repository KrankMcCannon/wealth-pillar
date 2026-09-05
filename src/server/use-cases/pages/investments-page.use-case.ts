import { cacheLife, cacheTag } from 'next/cache';
import type { User } from '@/lib/types';
import type { TimeSeriesEntry } from '@/lib/types/market-data.types';
import { withTimeout } from '@/lib/utils/with-timeout';
import { getMarketDataUseCase } from '../market-data/market-data.use-cases';
import {
  getInvestmentsOverviewUseCase,
  resolveInvestmentsTargetUserIds,
} from '../investments/investment.use-cases';
import type {
  AssetAllocationSlice,
  EnrichedInvestment,
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
  userScope: string;
}

function mapOverviewToHoldings(rows: EnrichedInvestment[]): InvestmentListItem[] {
  return [...rows]
    .sort((a, b) => {
      const ta = new Date(a.created_at ?? 0).getTime();
      const tb = new Date(b.created_at ?? 0).getTime();
      if (tb !== ta) return tb - ta;
      return b.id.localeCompare(a.id);
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      symbol: row.symbol,
      amount: row.amount,
      shares_acquired: row.shares_acquired,
      currency: row.currency,
      tax_paid: row.tax_paid,
      totalPaid: row.totalPaid,
      net_earn: row.net_earn,
      currentPrice: row.currentPrice,
      currentValue: row.currentValue,
      totalGain: row.totalGain,
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

  const [overview, indexData] = await Promise.all([
    getInvestmentsOverviewUseCase(targetUserIds),
    withTimeout(getMarketDataUseCase(indexSymbol), 1500, [] as TimeSeriesEntry[]),
  ]);

  return {
    summary: overview.summary,
    assetAllocation: overview.assetAllocation,
    portfolioHistory: overview.portfolioHistory,
    indexData,
    currentIndex: indexSymbol,
    holdings: mapOverviewToHoldings(overview.investments),
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
