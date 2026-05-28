import type { Account, Category, Transaction } from '@/lib/types';

export type SerializedTransaction = Transaction & { date: string };
export type SerializedCategory = Category;
export type SerializedAccount = Account & { balance: number };

export {
  formatCategoryFallback,
  normalizeAccountType,
  sumIncomeExpenseInWindow,
  computeCategoryStats,
  computeUserFlows,
  periodOverlapsWindow,
  flowsToAccountTypeSummary,
  netFlowDeltaPercent,
  type DateWindow,
} from '@/server/use-cases/reports/report.logic';
