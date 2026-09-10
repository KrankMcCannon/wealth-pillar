import type { BudgetPeriod } from '@/lib/types';
import { db } from '@/server/db/drizzle';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { isSyntheticBudgetPeriodId } from './synthetic-active-period.logic';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';
import { invalidateBudgetPeriodCaches } from '@/lib/utils/cache-utils';

export class RewindClosedPeriodError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'RewindClosedPeriodError';
  }
}

function toDateOnlyString(date: string | Date): string {
  if (typeof date === 'string') {
    return date.split('T')[0] ?? date;
  }
  return date.toISOString().split('T')[0] ?? '';
}

/** Chronologically previous persisted period (greatest start_date still before `period`). */
export function findPreviousPeriod(
  periods: BudgetPeriod[],
  period: BudgetPeriod
): BudgetPeriod | null {
  const start = toDateOnlyString(period.start_date);
  let best: BudgetPeriod | null = null;
  let bestStart = '';

  for (const candidate of periods) {
    if (candidate.id === period.id) continue;
    if (isSyntheticBudgetPeriodId(candidate.id)) continue;
    const candidateStart = toDateOnlyString(candidate.start_date);
    if (candidateStart >= start) continue;
    if (!best || candidateStart > bestStart) {
      best = candidate;
      bestStart = candidateStart;
    }
  }

  return best;
}

/** Chronologically next persisted period (smallest start_date still after `period`). */
export function findNextPeriod(periods: BudgetPeriod[], period: BudgetPeriod): BudgetPeriod | null {
  const start = toDateOnlyString(period.start_date);
  let best: BudgetPeriod | null = null;
  let bestStart = '';

  for (const candidate of periods) {
    if (candidate.id === period.id) continue;
    if (isSyntheticBudgetPeriodId(candidate.id)) continue;
    const candidateStart = toDateOnlyString(candidate.start_date);
    if (candidateStart <= start) continue;
    if (!best || candidateStart < bestStart) {
      best = candidate;
      bestStart = candidateStart;
    }
  }

  return best;
}

export interface RewindClosedPeriodResult {
  previousPeriod: BudgetPeriod;
  deletedPeriodId: string;
}

export async function rewindClosedPeriodUseCase(
  userId: string,
  periodId: string
): Promise<RewindClosedPeriodResult> {
  if (isSyntheticBudgetPeriodId(periodId)) {
    throw new RewindClosedPeriodError('syntheticPeriod');
  }

  const period = await BudgetPeriodsRepository.findById(periodId);
  if (!period || period.user_id !== userId) {
    throw new RewindClosedPeriodError('periodNotFound');
  }
  if (!period.is_active || period.end_date != null) {
    throw new RewindClosedPeriodError('periodMustBeActive');
  }

  const periods = await BudgetPeriodsRepository.findByUser(userId);
  const previous = findPreviousPeriod(periods, period);
  if (!previous || previous.is_active || !previous.end_date) {
    throw new RewindClosedPeriodError('noPreviousPeriod');
  }

  const previousPeriod = await db.transaction(async (tx) => {
    await BudgetPeriodsRepository.delete(periodId, tx);
    return BudgetPeriodsRepository.update(
      previous.id,
      {
        is_active: true,
        end_date: null,
        spendable_spent: null,
        reserve_saved: null,
        category_spending: {},
        snapshot_at: null,
      },
      tx
    );
  });

  revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');
  invalidateBudgetPeriodCaches({ userId, periodId });
  invalidateBudgetPeriodCaches({ userId, periodId: previous.id });
  const groupId = period.group_id ?? previous.group_id;
  if (groupId) {
    revalidateTag(`group:${groupId}:budgets`, 'max');
    revalidateTag(`group:${groupId}:transactions`, 'max');
  }

  return {
    previousPeriod,
    deletedPeriodId: periodId,
  };
}
