/** Safety caps for unbounded group transaction reads (dashboard/reports). */
export const DASHBOARD_TRANSACTIONS_LIMIT = 2000;
export const REPORTS_TRANSACTIONS_LIMIT = 5000;
export const BUDGETS_TRANSACTIONS_LIMIT = 2000;
export const RECENT_ACTIVITY_LIMIT = 5;
export const BUDGETS_TRANSACTIONS_OVERFLOW = 'BUDGETS_TRANSACTIONS_OVERFLOW';

export function dashboardTransactionStartDate(): Date {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  return date;
}
