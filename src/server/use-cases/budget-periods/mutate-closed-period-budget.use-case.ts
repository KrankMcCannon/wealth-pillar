import type { Budget, BudgetPeriod } from '@/lib/types';
import type { CreateBudgetInput } from '../budgets/types';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import {
  validateRequiredString,
  validatePositiveNumber,
  validateEnum,
  validateNonEmptyArray,
  validateId,
  validateMinLength,
} from '@/lib/utils/validation-utils';
import { invalidateBudgetPeriodCaches } from '@/lib/utils/cache-utils';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';
import type { DbExecutor } from '@/server/repositories/db-executor';
import { withBudgetPeriodTransaction } from './budget-period-transaction';
import { isSyntheticBudgetPeriodId } from './synthetic-active-period.logic';
import {
  deletePeriodBudgetList,
  materializePeriodBudgets,
  toBudgetsSnapshot,
  upsertPeriodBudgetList,
} from './period-budgets.logic';

export class ClosedPeriodBudgetError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'ClosedPeriodBudgetError';
  }
}

function validateBudgetInput(data: CreateBudgetInput): CreateBudgetInput {
  const description = validateRequiredString(data.description, 'Description');
  validateMinLength(description, 2, 'Description');
  validatePositiveNumber(data.amount, 'Amount');
  validateEnum(data.type, ['monthly', 'annually'] as const, 'Budget type');
  validateNonEmptyArray(data.categories, 'category');
  return {
    ...data,
    description,
    categories: data.categories,
  };
}

async function loadClosedPeriod(
  userId: string,
  periodId: string,
  executor: DbExecutor
): Promise<BudgetPeriod> {
  if (isSyntheticBudgetPeriodId(periodId)) {
    throw new ClosedPeriodBudgetError('syntheticPeriod');
  }
  const period = await BudgetPeriodsRepository.findById(periodId, executor);
  if (!period || period.user_id !== userId) {
    throw new ClosedPeriodBudgetError('periodNotFound');
  }
  if (period.end_date == null) {
    throw new ClosedPeriodBudgetError('periodMustBeClosed');
  }
  return period;
}

async function persistSnapshot(
  period: BudgetPeriod,
  budgets: Budget[],
  executor: DbExecutor
): Promise<void> {
  await BudgetPeriodsRepository.update(
    period.id,
    {
      budgets_snapshot: toBudgetsSnapshot(budgets),
    },
    executor
  );
}

function invalidateSnapshot(period: BudgetPeriod): void {
  invalidateBudgetPeriodCaches({ userId: period.user_id, periodId: period.id });
  if (period.group_id) {
    revalidateTag(`group:${period.group_id}:budgets`, 'max');
  }
  revalidateTag(CACHE_TAGS.USER_PREFERENCE(period.user_id), 'max');
}

export async function upsertClosedPeriodBudgetUseCase(
  userId: string,
  periodId: string,
  input: CreateBudgetInput,
  budgetId?: string
): Promise<Budget> {
  const validated = validateBudgetInput(input);
  const { period, saved } = await withBudgetPeriodTransaction(userId, async (tx) => {
    const period = await loadClosedPeriod(userId, periodId, tx);
    let list = materializePeriodBudgets(period);

    if (budgetId) {
      validateId(budgetId, 'Budget ID');
      if (!list.some((row) => row.id === budgetId)) {
        throw new ClosedPeriodBudgetError('budgetNotFound');
      }
    }

    const scoped: CreateBudgetInput = {
      ...validated,
      user_id: period.user_id,
      group_id: period.group_id ?? validated.group_id ?? '',
    };
    list = upsertPeriodBudgetList(list, scoped, budgetId);
    await persistSnapshot(period, list, tx);
    const savedId = budgetId ?? list[list.length - 1]!.id;
    const saved = list.find((row) => row.id === savedId);
    if (!saved) throw new ClosedPeriodBudgetError('budgetNotFound');
    return { period, saved };
  });
  invalidateSnapshot(period);
  return saved;
}

export async function deleteClosedPeriodBudgetUseCase(
  userId: string,
  periodId: string,
  budgetId: string
): Promise<{ id: string }> {
  validateId(budgetId, 'Budget ID');
  const period = await withBudgetPeriodTransaction(userId, async (tx) => {
    const period = await loadClosedPeriod(userId, periodId, tx);
    const list = materializePeriodBudgets(period);
    if (!list.some((row) => row.id === budgetId)) {
      throw new ClosedPeriodBudgetError('budgetNotFound');
    }
    await persistSnapshot(period, deletePeriodBudgetList(list, budgetId), tx);
    return period;
  });
  invalidateSnapshot(period);
  return { id: budgetId };
}
