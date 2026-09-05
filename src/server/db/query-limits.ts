/** Safety caps for unbounded group transaction reads (dashboard/reports). */
export const DASHBOARD_TRANSACTIONS_LIMIT = 2000;
export const REPORTS_TRANSACTIONS_LIMIT = 5000;
export const BUDGETS_TRANSACTIONS_LIMIT = 2000;
export const RECENT_ACTIVITY_LIMIT = 3;
export const BUDGETS_TRANSACTIONS_OVERFLOW = 'BUDGETS_TRANSACTIONS_OVERFLOW';
/** Newest matching txs shown on envelope detail; full set still used for spend math. */
export const BUDGET_DETAIL_TX_PREVIEW = 8;

export function dashboardTransactionStartDate(): Date {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  return date;
}
