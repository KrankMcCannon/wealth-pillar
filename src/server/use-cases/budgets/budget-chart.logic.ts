import type { Transaction, Budget, UserBudgetSummary } from '@/lib/types';
import { toDateTime, toDateString, today as luxonToday, diffInDays } from '@/lib/utils/date-utils';
import { filterTransactionsForBudgetsUnion, effectiveSpentFromTransactions } from './budget.logic';
import type { DateInput } from '@/lib/utils/date-utils';

export interface ChartDataPoint {
  x: number;
  y: number;
  amount: number;
  date: string;
  isFuture: boolean;
}

export interface GroupedBudgetTransaction {
  date: string;
  transactions: Transaction[];
  total: number;
}

export interface BudgetChartViewModel {
  chartAggregateSpent: number;
  chartData: ChartDataPoint[] | null;
  groupedTransactions: GroupedBudgetTransaction[];
  periodTransactions: Transaction[];
}

export function buildBudgetChartViewModel(
  transactions: Transaction[],
  userBudgets: Budget[],
  userId: string,
  periodStart: DateInput | null,
  periodEnd: DateInput | null,
  userBudgetSummary: UserBudgetSummary | null
): BudgetChartViewModel {
  if (!periodStart || userBudgets.length === 0) {
    return {
      chartAggregateSpent: 0,
      chartData: null,
      groupedTransactions: [],
      periodTransactions: [],
    };
  }

  const userTransactions = transactions.filter((t) => t.user_id === userId);
  const periodTransactions = filterTransactionsForBudgetsUnion(
    userTransactions,
    userBudgets,
    periodStart,
    periodEnd
  );

  const chartAggregateSpent = effectiveSpentFromTransactions(periodTransactions);

  const groupedMap: Record<string, Transaction[]> = {};
  for (const transaction of periodTransactions) {
    const dateKey = toDateString(transaction.date);
    if (!groupedMap[dateKey]) groupedMap[dateKey] = [];
    groupedMap[dateKey].push(transaction);
  }

  const groupedTransactions = Object.entries(groupedMap)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, txs]) => ({
      date,
      transactions: [...txs].sort((a, b) => {
        const dtA = toDateTime(a.date);
        const dtB = toDateTime(b.date);
        if (!dtA || !dtB) return 0;
        return dtB.toMillis() - dtA.toMillis();
      }),
      total: txs.reduce((sum, tx) => {
        const signed = tx.type === 'income' ? -tx.amount : tx.amount;
        return sum + signed;
      }, 0),
    }));

  const chartData = buildCumulativeChartPoints(
    periodTransactions,
    periodStart,
    periodEnd,
    userBudgetSummary?.totalBudget ?? 1
  );

  return { chartAggregateSpent, chartData, groupedTransactions, periodTransactions };
}

function buildCumulativeChartPoints(
  periodTransactions: Transaction[],
  periodStart: DateInput,
  periodEnd: DateInput | null,
  totalBudget: number
): ChartDataPoint[] | null {
  if (periodTransactions.length === 0) return null;

  const startDate = toDateTime(periodStart);
  const endDate = periodEnd ? toDateTime(periodEnd) : luxonToday();
  const today = luxonToday();

  if (!startDate || !endDate) return null;

  const totalDays = diffInDays(startDate, endDate);
  if (totalDays <= 0) return null;

  const dailySpending: Record<string, number> = {};
  for (const tx of periodTransactions) {
    const dateKey = toDateString(tx.date);
    const amount = tx.type === 'income' ? -tx.amount : tx.amount;
    dailySpending[dateKey] = (dailySpending[dateKey] || 0) + amount;
  }

  const points: ChartDataPoint[] = [];
  let cumulative = 0;
  const maxAmount = Math.max(1, totalBudget);
  const daysDenominator = Math.max(1, totalDays - 1);

  for (let i = 0; i < totalDays; i++) {
    const currentDate = startDate.plus({ days: i });
    const dateKey = toDateString(currentDate);

    cumulative += dailySpending[dateKey] || 0;
    const isFuture = currentDate > today;

    const x = (i / daysDenominator) * 350;
    const y = 180 - (cumulative / maxAmount) * 150;

    points.push({
      x: Math.max(0, x),
      y: Math.max(0, Math.min(180, y)),
      amount: cumulative,
      date: dateKey,
      isFuture,
    });
  }

  return points;
}
