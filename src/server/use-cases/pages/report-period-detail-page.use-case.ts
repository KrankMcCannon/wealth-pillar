import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { CACHE_TAGS } from '@/lib/cache/config';
import { AccessScope } from '@/lib/permissions/access-scope';
import type { Category, PeriodLiquidityAmounts, User } from '@/lib/types';
import { roundMoney } from '@/lib/utils/money';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import { getAllCategoriesDeduped } from '@/server/request-cache/services';
import { getBudgetsByUserUseCase } from '../budgets/get-budgets.use-case';
import { getTransactionsByUserUseCase } from '../transactions/get-transactions.use-case';
import { findLatestClosedPeriod } from '../budget-periods/edit-closing-date.use-case';
import { findPreviousPeriod } from '../budget-periods/rewind-closed-period.use-case';
import { isSyntheticBudgetPeriodId } from '../budget-periods/synthetic-active-period.logic';
import {
  computePeriodLiquidityAmounts,
  periodToDateWindow,
  resolvePeriodAmounts,
} from '../budget-periods/period-amounts.logic';
import {
  getProcessedUserPeriodsUseCase,
  calculatePeriodSummariesUseCase,
} from '../reports/reports.use-cases';
import type { ReportPeriodSummary } from '../reports/reports.use-cases';
import type { ReportsTopExpenseRow } from '../reports/report.logic';

export interface ReportPeriodDetailPageData {
  periodId: string;
  userId: string;
  summary: ReportPeriodSummary;
  startDate: string;
  endDate: string;
  storedAmounts: PeriodLiquidityAmounts;
  liveAmounts: PeriodLiquidityAmounts;
  snapshotMatchesLive: boolean;
  isLatestClosed: boolean;
  canRewind: boolean;
  previousPeriodId: string | null;
  categoryRows: ReportsTopExpenseRow[];
  /** ponytail: category labels/colors come from the current catalog, not a historical snapshot. */
}

function periodAmountsMatch(a: PeriodLiquidityAmounts, b: PeriodLiquidityAmounts): boolean {
  if (a.spendableSpent !== b.spendableSpent || a.reserveSaved !== b.reserveSaved) return false;
  const keys = new Set([...Object.keys(a.categorySpending), ...Object.keys(b.categorySpending)]);
  for (const key of keys) {
    if (roundMoney(a.categorySpending[key] ?? 0) !== roundMoney(b.categorySpending[key] ?? 0)) {
      return false;
    }
  }
  return true;
}

function categoryRowsFromSpending(
  spending: Record<string, number>,
  categories: Category[]
): ReportsTopExpenseRow[] {
  const byKey = new Map(categories.map((category) => [category.key, category]));
  return Object.entries(spending)
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, total]) => {
      const category = byKey.get(key);
      return {
        id: category?.id ?? key,
        key,
        name: category?.label ?? key,
        total,
        color: category?.color ?? '',
      };
    });
}

async function getCachedReportPeriodDetailPageData(
  groupId: string,
  periodId: string
): Promise<ReportPeriodDetailPageData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(CACHE_TAGS.BUDGET_PERIODS);
  cacheTag(CACHE_TAGS.BUDGET_PERIOD(periodId));
  cacheTag(`group:${groupId}:transactions`);
  cacheTag(`group:${groupId}:accounts`);
  cacheTag(`group:${groupId}:budgets`);
  cacheTag('categories');

  if (isSyntheticBudgetPeriodId(periodId)) {
    notFound();
  }

  const period = await BudgetPeriodsRepository.findById(periodId);
  if (!period) {
    notFound();
  }
  if (period.group_id && period.group_id !== groupId) {
    notFound();
  }

  const ownerRow = await UsersRepository.findById(period.user_id);
  if (!ownerRow || ownerRow.group_id !== groupId) {
    notFound();
  }
  const owner = ownerRow as unknown as User;

  const [transactions, accounts, budgets, categories, periods] = await Promise.all([
    getTransactionsByUserUseCase(period.user_id),
    AccountsRepository.findByUser(period.user_id),
    getBudgetsByUserUseCase(period.user_id),
    getAllCategoriesDeduped().catch(() => [] as Category[]),
    getProcessedUserPeriodsUseCase(owner),
  ]);

  const summaries = calculatePeriodSummariesUseCase(periods, transactions, accounts, budgets);
  const summary = summaries.find((row) => row.id === period.id);
  if (!summary) {
    notFound();
  }

  const window = periodToDateWindow(period);
  const storedAmounts = resolvePeriodAmounts(period, transactions, accounts);
  const liveAmounts = computePeriodLiquidityAmounts(transactions, accounts, window, period.user_id);

  const active = periods.find((row) => row.is_active) ?? null;
  const latestClosed = findLatestClosedPeriod(periods, active);
  const isOpen = period.end_date == null;
  const isLatestClosed = !isOpen && latestClosed?.id === period.id;
  const previous = findPreviousPeriod(periods, period);
  const canRewind = Boolean(
    isOpen && period.is_active && previous && !previous.is_active && previous.end_date
  );

  return {
    periodId: period.id,
    userId: period.user_id,
    summary,
    startDate: summary.startDate,
    endDate: summary.endDate,
    storedAmounts,
    liveAmounts,
    snapshotMatchesLive: periodAmountsMatch(storedAmounts, liveAmounts),
    isLatestClosed,
    canRewind,
    previousPeriodId: canRewind ? previous!.id : null,
    categoryRows: categoryRowsFromSpending(storedAmounts.categorySpending, categories),
  };
}

export async function getReportPeriodDetailPageData(
  groupId: string,
  periodId: string,
  currentUser: User
): Promise<ReportPeriodDetailPageData> {
  try {
    const data = await getCachedReportPeriodDetailPageData(groupId, periodId);
    if (!AccessScope.for(currentUser).canViewUser(data.userId)) {
      notFound();
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }
}
