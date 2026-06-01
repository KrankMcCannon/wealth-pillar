'use server';

import { revalidateBudgetPeriodRelatedPaths } from '@/lib/cache/revalidation-paths';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import { createBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/create-budget-period.use-case';
import { closeBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/close-budget-period.use-case';
import { deleteBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/delete-budget-period.use-case';
import { getBudgetsPeriodsByUserUseCase } from '@/server/use-cases/budget-periods/get-budget-periods-by-user.use-case';
import { getActiveBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/get-active-budget-period.use-case';
import { calculatePeriodTotalsUseCase } from '@/server/use-cases/budget-periods/calculate-period-totals.use-case';
import {
  editBudgetPeriodClosingDateUseCase,
  EditClosingDateError,
  getLatestClosedBudgetPeriodUseCase,
} from '@/server/use-cases/budget-periods/edit-closing-date.use-case';
import { getTransactionsByUserUseCase } from '@/server/use-cases/transactions/get-transactions.use-case';
import { getBudgetsByUserUseCase } from '@/server/use-cases/budgets/get-budgets.use-case';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { AccessScope } from '@/lib/permissions/access-scope';
import type { BudgetPeriod, User } from '@/lib/types';
import type { ServiceResult } from '@/lib/types/service-result';
import { DateTime } from 'luxon';

async function getBudgetPeriodActionTranslator(locale?: string) {
  if (locale) {
    return getTranslations({ locale, namespace: 'Budgets.PeriodActions' });
  }
  return getTranslations('Budgets.PeriodActions');
}

function denyUnlessCanViewUser(
  currentUser: User,
  userId: string,
  error: string
): { data: null; error: string } | null {
  if (!AccessScope.for(currentUser).canViewUser(userId)) {
    return { data: null, error };
  }
  return null;
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
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: t('errors.unauthenticated'),
      };
    }

    const denied = denyUnlessCanViewUser(
      currentUser as unknown as User,
      userId,
      t('errors.noPermissionUserData')
    );
    if (denied) return denied;

    // Create new period
    const result = await createBudgetPeriodUseCase(userId, startDate);

    revalidateBudgetPeriodRelatedPaths();

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
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: t('errors.unauthenticated'),
      };
    }

    const deniedClose = denyUnlessCanViewUser(
      currentUser as unknown as User,
      userId,
      t('errors.noPermissionUserData')
    );
    if (deniedClose) return deniedClose;

    // Close period with calculations or pre-calculated totals
    const result = await closeBudgetPeriodUseCase(userId, periodId, endDate);

    if (result) {
      revalidateBudgetPeriodRelatedPaths();
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: t('errors.unauthenticated'),
      };
    }

    const deniedEdit = denyUnlessCanViewUser(
      currentUser as unknown as User,
      userId,
      t('errors.noPermissionUserData')
    );
    if (deniedEdit) return deniedEdit;

    const result = await editBudgetPeriodClosingDateUseCase(userId, periodId, newEndDate);

    revalidateBudgetPeriodRelatedPaths();

    return { data: result.closedPeriod, error: null };
  } catch (error) {
    if (error instanceof EditClosingDateError && t) {
      const errorMessages: Record<string, string> = {
        invalidDate: t('errors.invalidDate'),
        periodNotFound: t('errors.periodNotFound'),
        periodMustBeClosed: t('errors.periodMustBeClosed'),
        noActivePeriod: t('errors.noActivePeriod'),
        notLatestPeriod: t('errors.notLatestPeriod'),
        endBeforeStart: t('errors.endBeforeStart'),
        futureActiveStart: t('errors.futureActiveStart'),
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: t('errors.unauthenticated'),
      };
    }

    const deniedLatest = denyUnlessCanViewUser(
      currentUser as unknown as User,
      userId,
      t('errors.noPermissionUserData')
    );
    if (deniedLatest) return deniedLatest;

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
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: t('errors.unauthenticated'),
      };
    }

    const deniedDelete = denyUnlessCanViewUser(
      currentUser as unknown as User,
      userId,
      t('errors.noPermissionUserData')
    );
    if (deniedDelete) return deniedDelete;

    // Delete period
    await deleteBudgetPeriodUseCase(userId, periodId);

    revalidateBudgetPeriodRelatedPaths();

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
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: t('errors.unauthenticated'),
      };
    }

    const deniedPeriods = denyUnlessCanViewUser(
      currentUser as unknown as User,
      userId,
      t('errors.noPermissionUserData')
    );
    if (deniedPeriods) return deniedPeriods;

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
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: t('errors.unauthenticated'),
      };
    }

    const deniedActive = denyUnlessCanViewUser(
      currentUser as unknown as User,
      userId,
      t('errors.noPermissionUserData')
    );
    if (deniedActive) return deniedActive;

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
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: t('errors.unauthenticatedShort') };
    }

    const deniedPreview = denyUnlessCanViewUser(
      currentUser as unknown as User,
      userId,
      t('errors.permissionDenied')
    );
    if (deniedPreview) return deniedPreview;

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
