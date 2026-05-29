import { formatDateShort } from '@/lib/utils/date-utils';
import type { GroupedBudgetTransaction } from '@/server/use-cases/budgets/budget-chart.logic';

/** Locale-aware day groups for budget detail transaction list. */
export function formatGroupedTransactionsForClient(
  groups: GroupedBudgetTransaction[],
  locale: string
) {
  return groups.map((g) => ({
    date: g.date,
    formattedDate: formatDateShort(g.date, locale),
    transactions: g.transactions,
    total: g.total,
  }));
}
