/** Safety caps for unbounded group transaction reads (dashboard/reports). */
export const DASHBOARD_TRANSACTIONS_LIMIT = 2000;
export const REPORTS_TRANSACTIONS_LIMIT = 5000;

export function dashboardTransactionStartDate(): Date {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  return date;
}
