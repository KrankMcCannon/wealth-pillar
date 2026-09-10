'use server';

import { getTranslations } from 'next-intl/server';
import {
  denyUnlessCanViewUser,
  isAuthDenial,
  requireAuthenticatedUser,
} from '@/lib/permissions/action-auth';
import { createBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/create-budget-period.use-case';
import { closeBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/close-budget-period.use-case';
import { deleteBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/delete-budget-period.use-case';
import { getBudgetsPeriodsByUserUseCase } from '@/server/use-cases/budget-periods/get-budget-periods-by-user.use-case';
import { getActiveBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/get-active-budget-period.use-case';
import { calculatePeriodTotalsUseCase } from '@/server/use-cases/budget-periods/calculate-period-totals.use-case';
import {
  editBudgetPeriodClosingDateUseCase,
  editPeriodDatesUseCase,
  EditClosingDateError,
  getLatestClosedBudgetPeriodUseCase,
} from '@/server/use-cases/budget-periods/edit-closing-date.use-case';
import {
  recalculateClosedPeriodSnapshotUseCase,
  RecalculateClosedPeriodError,
} from '@/server/use-cases/budget-periods/recalculate-closed-period.use-case';
import {
  rewindClosedPeriodUseCase,
  RewindClosedPeriodError,
} from '@/server/use-cases/budget-periods/rewind-closed-period.use-case';
import {
  upsertClosedPeriodBudgetUseCase,
  deleteClosedPeriodBudgetUseCase,
  ClosedPeriodBudgetError,
} from '@/server/use-cases/budget-periods/mutate-closed-period-budget.use-case';
import { getTransactionsByUserUseCase } from '@/server/use-cases/transactions/get-transactions.use-case';
import { getBudgetsByUserUseCase } from '@/server/use-cases/budgets/get-budgets.use-case';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import type { Budget, BudgetPeriod, User } from '@/lib/types';
import type { CreateBudgetInput } from '@/server/use-cases/budgets/types';
import type { ServiceResult } from '@/lib/types/service-result';
import { DateTime } from 'luxon';

async function getBudgetPeriodActionTranslator(locale?: string) {
  if (locale) {
    return getTranslations({ locale, namespace: 'Budgets.PeriodActions' });
  }
  return getTranslations('Budgets.PeriodActions');
}

async function authorizeBudgetPeriodUser(
  unauthenticatedError: string,
  userId: string,
  permissionError: string
): Promise<User | ServiceResult<never>> {
  const auth = await requireAuthenticatedUser(unauthenticatedError);
  if (isAuthDenial(auth)) return auth;
  const denied = denyUnlessCanViewUser(auth, userId, permissionError);
  if (denied) return denied;
  return auth;
}

/**
 * Server Action: Start Budget Period
 * Creates a new active budget period for a user
 * Automatically deactivates any existing active period
 *
 * Permissions: members can only start periods for themselves
 */
export async function startPeriodAction(
  userId: string,
  startDate: string,
  locale?: string
): Promise<ServiceResult<BudgetPeriod>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionManageOthers')
    );
    if (isAuthDenial(auth)) return auth;

    // Create new period
    const result = await createBudgetPeriodUseCase(userId, startDate);

    return { data: result, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.startFailed') ?? 'Failed to start budget period'),
    };
  }
}

/**
 * Server Action: Close Budget Period
 * Closes the active budget period by setting end_date and calculating totals
 * Requires periodId to close a specific period
 *
 * Permissions: members can only close their own periods
 */
export async function closePeriodAction(
  userId: string,
  periodId: string,
  endDate: string,
  locale?: string
): Promise<ServiceResult<BudgetPeriod>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionClose')
    );
    if (isAuthDenial(auth)) return auth;

    // Close period with calculations or pre-calculated totals
    const result = await closeBudgetPeriodUseCase(userId, periodId, endDate);

    if (result) {
      return { data: result, error: null };
    }

    return { data: null, error: t('errors.closeFailed') };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.closeFailed') ?? 'Failed to close budget period'),
    };
  }
}

/**
 * Server Action: Edit Closing Date of Latest Closed Budget Period
 * Adjusts end_date of the most recently closed period and shifts the active period start_date.
 *
 * Permissions: members can only edit their own periods
 */
export async function editClosingDateAction(
  userId: string,
  periodId: string,
  newEndDate: string,
  locale?: string
): Promise<ServiceResult<BudgetPeriod>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionEditClosingDate')
    );
    if (isAuthDenial(auth)) return auth;

    const result = await editBudgetPeriodClosingDateUseCase(userId, periodId, newEndDate);

    return { data: result.closedPeriod, error: null };
  } catch (error) {
    if (error instanceof EditClosingDateError && t) {
      const errorMessages: Record<string, string> = {
        invalidDate: t('errors.invalidDate'),
        periodNotFound: t('errors.periodNotFound'),
        periodMustBeClosed: t('errors.periodMustBeClosed'),
        cannotEditActiveEnd: t('errors.cannotEditActiveEnd'),
        noActivePeriod: t('errors.noActivePeriod'),
        notLatestPeriod: t('errors.notLatestPeriod'),
        endBeforeStart: t('errors.endBeforeStart'),
        futureActiveStart: t('errors.futureActiveStart'),
        neighborOutOfRange: t('errors.neighborOutOfRange'),
        syntheticPeriod: t('errors.syntheticPeriod'),
      };
      const mapped = errorMessages[error.code];
      if (mapped) {
        return { data: null, error: mapped };
      }
    }

    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.editFailed') ?? 'Failed to edit closing date'),
    };
  }
}

export async function editPeriodDatesAction(
  userId: string,
  periodId: string,
  dates: { startDate?: string | undefined; endDate?: string | undefined },
  locale?: string
): Promise<ServiceResult<BudgetPeriod>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionEditClosingDate')
    );
    if (isAuthDenial(auth)) return auth;

    const result = await editPeriodDatesUseCase(userId, periodId, dates);
    return { data: result.period, error: null };
  } catch (error) {
    if (error instanceof EditClosingDateError && t) {
      const errorMessages: Record<string, string> = {
        invalidDate: t('errors.invalidDate'),
        periodNotFound: t('errors.periodNotFound'),
        periodMustBeClosed: t('errors.periodMustBeClosed'),
        cannotEditActiveEnd: t('errors.cannotEditActiveEnd'),
        noActivePeriod: t('errors.noActivePeriod'),
        notLatestPeriod: t('errors.notLatestPeriod'),
        endBeforeStart: t('errors.endBeforeStart'),
        futureActiveStart: t('errors.futureActiveStart'),
        neighborOutOfRange: t('errors.neighborOutOfRange'),
        syntheticPeriod: t('errors.syntheticPeriod'),
      };
      const mapped = errorMessages[error.code];
      if (mapped) {
        return { data: null, error: mapped };
      }
    }

    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.editFailed') ?? 'Failed to edit period dates'),
    };
  }
}

/**
 * Server Action: Get Latest Closed Budget Period
 * Returns the most recently closed period (adjacent to the active period), if any.
 */
export async function getLatestClosedPeriodAction(
  userId: string,
  locale?: string
): Promise<ServiceResult<BudgetPeriod | null>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionUserData')
    );
    if (isAuthDenial(auth)) return auth;

    const period = await getLatestClosedBudgetPeriodUseCase(userId);

    return { data: period, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.fetchPeriodsFailed') ?? 'Failed to fetch budget periods'),
    };
  }
}

/**
 * Server Action: Delete Budget Period
 * Permanently deletes a budget period
 * WARNING: This action cannot be undone
 *
 * Permissions: members can only delete their own periods
 */
export async function deletePeriodAction(
  userId: string,
  periodId: string,
  locale?: string
): Promise<ServiceResult<{ id: string }>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionDelete')
    );
    if (isAuthDenial(auth)) return auth;

    // Delete period
    await deleteBudgetPeriodUseCase(userId, periodId);

    return { data: { id: periodId }, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.deleteFailed') ?? 'Failed to delete budget period'),
    };
  }
}

export async function recalculateClosedPeriodAction(
  userId: string,
  periodId: string,
  locale?: string
): Promise<ServiceResult<BudgetPeriod>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionRecalculate')
    );
    if (isAuthDenial(auth)) return auth;

    const result = await recalculateClosedPeriodSnapshotUseCase(userId, periodId);
    return { data: result, error: null };
  } catch (error) {
    if (error instanceof RecalculateClosedPeriodError && t) {
      const errorMessages: Record<string, string> = {
        periodNotFound: t('errors.periodNotFound'),
        periodMustBeClosed: t('errors.periodMustBeClosed'),
        syntheticPeriod: t('errors.syntheticPeriod'),
      };
      const mapped = errorMessages[error.code];
      if (mapped) return { data: null, error: mapped };
    }
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.recalculateFailed') ?? 'Failed to recalculate budget period'),
    };
  }
}

export async function rewindClosedPeriodAction(
  userId: string,
  periodId: string,
  locale?: string
): Promise<ServiceResult<{ previousPeriodId: string }>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionDelete')
    );
    if (isAuthDenial(auth)) return auth;

    const result = await rewindClosedPeriodUseCase(userId, periodId);
    return { data: { previousPeriodId: result.previousPeriod.id }, error: null };
  } catch (error) {
    if (error instanceof RewindClosedPeriodError && t) {
      const errorMessages: Record<string, string> = {
        periodNotFound: t('errors.periodNotFound'),
        periodMustBeActive: t('errors.periodMustBeActive'),
        noPreviousPeriod: t('errors.noPreviousPeriod'),
        syntheticPeriod: t('errors.syntheticPeriod'),
      };
      const mapped = errorMessages[error.code];
      if (mapped) return { data: null, error: mapped };
    }
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.rewindFailed') ?? 'Failed to delete budget period'),
    };
  }
}

/**
 * Server Action: Get Budget Periods for User
 * Fetches all budget periods for a specific user
 *
 * Permissions: members can only view their own periods
 */
export async function getUserPeriodsAction(
  userId: string,
  locale?: string
): Promise<ServiceResult<BudgetPeriod[]>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionViewOthers')
    );
    if (isAuthDenial(auth)) return auth;

    // Fetch periods
    const periods = await getBudgetsPeriodsByUserUseCase(userId);

    return { data: periods, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.fetchPeriodsFailed') ?? 'Failed to fetch budget periods'),
    };
  }
}

/**
 * Server Action: Get Active Period for User
 * Fetches the currently active budget period for a user
 *
 * Permissions: members can only view their own active period
 */
export async function getActivePeriodAction(
  userId: string,
  locale?: string
): Promise<ServiceResult<BudgetPeriod | null>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionViewActiveOthers')
    );
    if (isAuthDenial(auth)) return auth;

    // Fetch active period
    const period = await getActiveBudgetPeriodUseCase(userId);

    return {
      data: period,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.fetchActiveFailed') ?? 'Failed to fetch active period'),
    };
  }
}

/**
 * Server Action: Get Period Preview
 * Calculates budget stats for a potential period date range
 * Used by BudgetPeriodManager to avoid sending full transaction history to client
 */
export async function getPeriodPreviewAction(
  userId: string,
  startDate: string,
  endDate: string,
  locale?: string
): Promise<
  ServiceResult<{
    totalSpent: number;
    totalSaved: number;
    totalBudget: number;
    categorySpending: Record<string, number>;
  }>
> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.permissionDenied')
    );
    if (isAuthDenial(auth)) return auth;

    // Fetch necessary data on server
    // We fetch all transactions for the user to ensure accurate calculations
    const [transactions, budgets, accounts] = await Promise.all([
      getTransactionsByUserUseCase(userId),
      getBudgetsByUserUseCase(userId),
      AccountsRepository.findByUser(userId),
    ]);

    // Instantiate a temporary period object for calculation
    const tempPeriod: BudgetPeriod = {
      id: 'preview',
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    // Use BudgetPeriodService.calculatePeriodTotals
    const startDt = DateTime.fromISO(startDate);
    const endDt = DateTime.fromISO(endDate);

    const totals = calculatePeriodTotalsUseCase(transactions, tempPeriod, startDt, endDt, accounts);

    // Calculate total budget amount
    const totalBudget = budgets.filter((b) => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);

    return {
      data: {
        totalSpent: totals.totalSpent,
        totalSaved: totals.totalSaved,
        totalBudget,
        categorySpending: totals.categorySpending,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.previewFailed') ?? 'Failed to calculate preview'),
    };
  }
}

function mapClosedPeriodBudgetError(
  error: ClosedPeriodBudgetError,
  t: Awaited<ReturnType<typeof getTranslations>>
): string | null {
  const errorMessages: Record<string, string> = {
    periodNotFound: t('errors.periodNotFound'),
    periodMustBeClosed: t('errors.periodMustBeClosed'),
    syntheticPeriod: t('errors.syntheticPeriod'),
    budgetNotFound: t('errors.budgetNotFound'),
  };
  return errorMessages[error.code] ?? null;
}

export async function upsertClosedPeriodBudgetAction(
  userId: string,
  periodId: string,
  input: CreateBudgetInput,
  locale?: string,
  budgetId?: string
): Promise<ServiceResult<Budget>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionManageOthers')
    );
    if (isAuthDenial(auth)) return auth;

    const budget = await upsertClosedPeriodBudgetUseCase(userId, periodId, input, budgetId);
    return { data: budget, error: null };
  } catch (error) {
    if (error instanceof ClosedPeriodBudgetError && t) {
      const mapped = mapClosedPeriodBudgetError(error, t);
      if (mapped) return { data: null, error: mapped };
    }
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.periodBudgetFailed') ?? 'Failed to update period budget'),
    };
  }
}

export async function deleteClosedPeriodBudgetAction(
  userId: string,
  periodId: string,
  budgetId: string,
  locale?: string
): Promise<ServiceResult<{ id: string }>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetPeriodActionTranslator(locale);
    const auth = await authorizeBudgetPeriodUser(
      t('errors.unauthenticated'),
      userId,
      t('errors.noPermissionManageOthers')
    );
    if (isAuthDenial(auth)) return auth;

    const result = await deleteClosedPeriodBudgetUseCase(userId, periodId, budgetId);
    return { data: result, error: null };
  } catch (error) {
    if (error instanceof ClosedPeriodBudgetError && t) {
      const mapped = mapClosedPeriodBudgetError(error, t);
      if (mapped) return { data: null, error: mapped };
    }
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.periodBudgetFailed') ?? 'Failed to update period budget'),
    };
  }
}
