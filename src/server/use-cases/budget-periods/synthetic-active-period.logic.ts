import type { BudgetPeriod, User } from '@/lib/types';

/**
 * When no open period exists, append a synthetic active period for reporting/chart windows.
 */
export function addSyntheticActivePeriod(user: User, periods: BudgetPeriod[]): void {
  let startDateStr = new Date().toISOString().split('T')[0];

  if (periods.length > 0) {
    const sortedByEnd = [...periods].sort((a, b) => {
      const aEnd = a.end_date ? String(a.end_date) : '0000-00-00';
      const bEnd = b.end_date ? String(b.end_date) : '0000-00-00';
      return bEnd.localeCompare(aEnd);
    });

    const lastPeriod = sortedByEnd[0];
    if (lastPeriod?.end_date) {
      const lastEnd = new Date(lastPeriod.end_date);
      lastEnd.setDate(lastEnd.getDate() + 1);
      startDateStr = lastEnd.toISOString().split('T')[0];
    }
  } else if (user.budget_start_date) {
    const now = new Date();
    const day = user.budget_start_date;
    const validDate = new Date(now.getFullYear(), now.getMonth(), day);

    if (now < validDate) {
      validDate.setMonth(validDate.getMonth() - 1);
    }

    const year = validDate.getFullYear();
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const d = String(validDate.getDate()).padStart(2, '0');
    startDateStr = `${year}-${month}-${d}`;
  }

  const today = new Date().toISOString().split('T')[0];
  if (startDateStr != null && today != null && startDateStr <= today) {
    const nowIso = new Date().toISOString();
    periods.push({
      id: `active-generated-${user.id}`,
      start_date: startDateStr,
      end_date: null,
      is_active: true,
      user_id: user.id,
      created_at: nowIso,
      updated_at: nowIso,
    });
  }
}
