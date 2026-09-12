import { CACHE_TAGS } from '@/lib/cache/config';
import { AccessScope } from '@/lib/permissions/access-scope';
import type { Budget, BudgetProgress, Category, PeriodLiquidityAmounts, User } from '@/lib/types';
import { roundMoney } from '@/lib/utils/money';
import { toDateString } from '@/lib/utils';
import { REPORTS_TRANSACTIONS_LIMIT } from '@/server/db/query-limits';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
} from '@/server/request-cache/services';
import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { findLatestClosedPeriod } from '../budget-periods/edit-closing-date.use-case';
import {
  computePeriodLiquidityAmounts,
  periodToDateWindow,
  resolvePeriodAmounts,
} from '../budget-periods/period-amounts.logic';
import { categoryKeysFromBudgets, resolvePeriodBudgets } from '../budget-periods/period-budgets.logic';
import { findPreviousPeriod } from '../budget-periods/rewind-closed-period.use-case';
import { isSyntheticBudgetPeriodId } from '../budget-periods/synthetic-active-period.logic';
import { calculateBudgetsWithProgress } from '../budgets/budget.logic';
import { getBudgetsByUserUseCase } from '../budgets/get-budgets.use-case';
import type { ReportsTopExpenseRow } from '../reports/report.logic';
import type { ReportPeriodSummary } from '../reports/reports.use-cases';
import {
  calculatePeriodSummariesUseCase,
  getProcessedUserPeriodsUseCase,
} from '../reports/reports.use-cases';
import { parsePeriodDates } from '../shared/period.logic';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';

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
  periodBudgets: Budget[];
  budgetProgress: BudgetProgress[];
  categories: Category[];
  /** ponytail: category labels/colors come from the current catalog, not a historical snapshot. */
}

function periodAmountsMatch(a: PeriodLiquidityAmounts, b: PeriodLiquidityAmounts): boolean {
  if (a.spendableSpent !== b.spendableSpent) return false;
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

  const window = periodToDateWindow(period);
  const startDate = new Date(`${toDateString(period.start_date)}T00:00:00.000Z`);
  const endDate = new Date(
    `${toDateString(period.end_date ?? new Date())}T23:59:59.999Z`
  );

  const [transactionResult, accounts, budgets, categories, periods] = await Promise.all([
    getTransactionsByGroupUseCase(groupId, {
      startDate,
      endDate,
      limit: REPORTS_TRANSACTIONS_LIMIT,
      countTotal: false,
    }),
    getAccountsByGroupDeduped(groupId),
    getBudgetsByUserUseCase(period.user_id),
    getAllCategoriesDeduped().catch(() => [] as Category[]),
    getProcessedUserPeriodsUseCase(owner),
  ]);
  const transactions = transactionResult.data;

  const summaries = calculatePeriodSummariesUseCase([period], transactions, accounts, budgets);
  const summary = summaries.find((row) => row.id === period.id);
  if (!summary) {
    notFound();
  }

  const periodBudgets = resolvePeriodBudgets(period, budgets);
  const envelopeKeys = categoryKeysFromBudgets(periodBudgets);
  const storedAmounts = resolvePeriodAmounts(period, transactions, accounts, undefined, envelopeKeys);
  const liveAmounts = computePeriodLiquidityAmounts(
    transactions,
    accounts,
    window,
    period.user_id,
    envelopeKeys
  );

  const active = periods.find((row) => row.is_active) ?? null;
  const latestClosed = findLatestClosedPeriod(periods, active);
  const isOpen = period.end_date == null;
  const isLatestClosed = !isOpen && latestClosed?.id === period.id;
  const previous = findPreviousPeriod(periods, period);
  const canRewind = Boolean(
    isOpen && period.is_active && previous && !previous.is_active && previous.end_date
  );
  const [periodStart, periodEnd] = parsePeriodDates(period);

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
    periodBudgets,
    budgetProgress: calculateBudgetsWithProgress(
      periodBudgets,
      transactions,
      periodStart,
      periodEnd,
      accounts,
      period.user_id
    ),
    categories,
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
