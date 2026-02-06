'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import { TransactionService, BudgetService, BudgetPeriodService } from '@/server/services';
import { canAccessUserData, isMember } from '@/lib/utils';
import type { BudgetPeriod, User } from '@/lib/types';
import { DateTime } from 'luxon';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

async function getBudgetPeriodActionTranslator(locale?: string) {
  if (locale) {
    return getTranslations({ locale, namespace: 'Budgets.PeriodActions' });
  }
  return getTranslations('Budgets.PeriodActions');
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

    // Permission validation: members can only start periods for themselves
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return {
        data: null,
        error: t('errors.noPermissionManageOthers'),
      };
    }

    // Admins can start for anyone, but verify target user exists
    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return {
        data: null,
        error: t('errors.noPermissionUserData'),
      };
    }

    // Create new period
    const result = await BudgetPeriodService.createPeriod(userId, startDate);

    // Revalidate pages that display budget periods
    revalidatePath('/budgets');
    revalidatePath('/reports');

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

    // Permission validation
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return {
        data: null,
        error: t('errors.noPermissionClose'),
      };
    }

    // Admins can close for anyone
    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return {
        data: null,
        error: t('errors.noPermissionUserData'),
      };
    }

    // Close period with calculations or pre-calculated totals
    const result = await BudgetPeriodService.closePeriod(userId, periodId, endDate);

    if (result) {
      // Revalidate pages that display budget periods
      revalidatePath('/budgets');
      revalidatePath('/reports');
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

    // Permission validation
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return {
        data: null,
        error: t('errors.noPermissionDelete'),
      };
    }

    // Admins can delete for anyone
    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return {
        data: null,
        error: t('errors.noPermissionUserData'),
      };
    }

    // Delete period
    await BudgetPeriodService.deletePeriod(userId, periodId);

    // Revalidate pages that display budget periods
    revalidatePath('/budgets');
    revalidatePath('/reports');

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

    // Permission validation
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return {
        data: null,
        error: t('errors.noPermissionViewOthers'),
      };
    }

    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return {
        data: null,
        error: t('errors.noPermissionUserData'),
      };
    }

    // Fetch periods
    const periods = await BudgetPeriodService.getPeriodsByUser(userId);

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

    // Permission validation
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return {
        data: null,
        error: t('errors.noPermissionViewActiveOthers'),
      };
    }

    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return {
        data: null,
        error: t('errors.noPermissionUserData'),
      };
    }

    // Fetch active period
    const period = await BudgetPeriodService.getActivePeriod(userId);

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

    // Permission check
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return { data: null, error: t('errors.permissionDenied') };
    }
    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return { data: null, error: t('errors.permissionDenied') };
    }

    // Fetch necessary data on server
    // We fetch all transactions for the user to ensure accurate calculations
    const [transactions, budgets] = await Promise.all([
      TransactionService.getTransactionsByUser(userId),
      BudgetService.getBudgetsByUser(userId),
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

    const totals = BudgetPeriodService.calculatePeriodTotals(
      transactions,
      tempPeriod,
      startDt,
      endDt,
      budgets
    );

    // Calculate total budget amount
    const totalBudget = budgets.filter((b) => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);

    return {
      data: {
        totalSpent: totals.total_spent,
        totalSaved: totals.total_saved,
        totalBudget,
        categorySpending: totals.category_spending,
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
