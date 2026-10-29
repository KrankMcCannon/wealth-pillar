import type { BudgetCategoryBreakdownItem } from '../budgets/budget.logic';
import type { GroupedBudgetTransaction } from '../budgets/budget-chart.logic';
import type { Account, Budget, BudgetPeriod, BudgetProgress, Category } from '@/lib/types';

export interface BudgetDetailPageData {
  budget: Budget;
  progress: BudgetProgress;
  activePeriod: BudgetPeriod | null;
  periodStart: string | null;
  periodEnd: string | null;
  categoryBreakdown: BudgetCategoryBreakdownItem[];
  groupedTransactions: GroupedBudgetTransaction[];
  accounts: Account[];
  categories: Category[];
}
