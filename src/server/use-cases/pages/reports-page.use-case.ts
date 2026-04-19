import {
  getReportsDataUseCase,
  calculateAccountTypeSummaryUseCase,
  calculatePeriodSummariesUseCase,
  calculateTimeTrendsUseCase,
  type AccountTypeSummary,
  type ReportPeriodSummary,
} from '../reports/reports.use-cases';
import { serialize } from '@/lib/utils/serializer';
import type { Transaction, Category, Account } from '@/lib/types';

export interface ReportsPageData {
  accountTypeSummary: AccountTypeSummary[];
  periodSummaries: ReportPeriodSummary[];
  spendingTrends: { date: string; income: number; expense: number }[];
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

export async function getReportsPageDataUseCase(
  groupId: string,
  groupUserIds: string[]
): Promise<ReportsPageData> {
  const reportsData = await getReportsDataUseCase(groupId, groupUserIds);
  const { transactions, accounts, periods, categories } = reportsData;

  const accountTypeSummary = calculateAccountTypeSummaryUseCase(transactions, accounts);
  const periodSummaries = calculatePeriodSummariesUseCase(periods, transactions, accounts);

  const spendingTrends = calculateTimeTrendsUseCase(transactions, {
    start: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1),
    end: new Date(),
  });

  return {
    accountTypeSummary,
    periodSummaries,
    spendingTrends,
    transactions: serialize(transactions),
    categories: serialize(categories),
    accounts: serialize(accounts),
  };
}
