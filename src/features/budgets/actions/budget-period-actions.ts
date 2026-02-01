'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import { TransactionService, BudgetService, BudgetPeriodService } from '@/server/services';
import { canAccessUserData, isMember } from '@/lib/utils';
import type { BudgetPeriod, User } from '@/lib/types';
import { DateTime } from 'luxon';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Server Action: Start Budget Period
 * Creates a new active budget period for a user
 * Automatically deactivates any existing active period
 *
 * Permissions: members can only start periods for themselves
 */
export async function startPeriodAction(
  userId: string,
  startDate: string
): Promise<ServiceResult<BudgetPeriod>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      };
    }

    // Permission validation: members can only start periods for themselves
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return {
        data: null,
        error: 'Non hai i permessi per gestire i periodi di altri utenti',
      };
    }

    // Admins can start for anyone, but verify target user exists
    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return {
        data: null,
        error: 'Non hai i permessi per accedere ai dati di questo utente',
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
        error instanceof Error ? error.message : 'Failed to start budget period',
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
): Promise<ServiceResult<BudgetPeriod>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      };
    }

    // Permission validation
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return {
        data: null,
        error: 'Non hai i permessi per chiudere questo periodo',
      };
    }

    // Admins can close for anyone
    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return {
        data: null,
        error: 'Non hai i permessi per accedere ai dati di questo utente',
      };
    }

    // Close period with calculations or pre-calculated totals
    const result = await BudgetPeriodService.closePeriod(
      userId,
      periodId,
      endDate,
    );

    if (result) {
      // Revalidate pages that display budget periods
      revalidatePath('/budgets');
      revalidatePath('/reports');
      return { data: result, error: null };
    }

    return { data: null, error: "Failed to close period" };

  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to close budget period',
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
  periodId: string
): Promise<ServiceResult<{ id: string }>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      };
    }

    // Permission validation
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return {
        data: null,
        error: 'Non hai i permessi per eliminare questo periodo',
      };
    }

    // Admins can delete for anyone
    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return {
        data: null,
        error: 'Non hai i permessi per accedere ai dati di questo utente',
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
          : 'Failed to delete budget period',
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
  userId: string
): Promise<ServiceResult<BudgetPeriod[]>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      };
    }

    // Permission validation
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return {
        data: null,
        error: 'Non hai i permessi per visualizzare i periodi di altri utenti',
      };
    }

    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return {
        data: null,
        error: 'Non hai i permessi per accedere ai dati di questo utente',
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
          : 'Failed to fetch budget periods',
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
  userId: string
): Promise<ServiceResult<BudgetPeriod | null>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      };
    }

    // Permission validation
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return {
        data: null,
        error:
          'Non hai i permessi per visualizzare il periodo attivo di altri utenti',
      };
    }

    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return {
        data: null,
        error: 'Non hai i permessi per accedere ai dati di questo utente',
      };
    }

    // Fetch active period
    const period = await BudgetPeriodService.getActivePeriod(userId);

    return {
      data: period,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch active period'
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
  endDate: string
): Promise<ServiceResult<{
  totalSpent: number;
  totalSaved: number;
  totalBudget: number;
  categorySpending: Record<string, number>;
}>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato' };
    }

    // Permission check
    if (isMember(currentUser as unknown as User) && userId !== currentUser.id) {
      return { data: null, error: 'Permesso negato' };
    }
    if (!canAccessUserData(currentUser as unknown as User, userId)) {
      return { data: null, error: 'Permesso negato' };
    }

    // Fetch necessary data on server
    // We fetch all transactions for the user to ensure accurate calculations
    const [transactions, budgets] = await Promise.all([
      TransactionService.getTransactionsByUser(userId),
      BudgetService.getBudgetsByUser(userId)
    ]);

    // Instantiate a temporary period object for calculation
    const tempPeriod: BudgetPeriod = {
      id: 'preview',
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
      created_at: '',
      updated_at: ''
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
    const totalBudget = budgets
      .filter(b => b.amount > 0)
      .reduce((sum, b) => sum + b.amount, 0);

    return {
      data: {
        totalSpent: totals.total_spent,
        totalSaved: totals.total_saved,
        totalBudget,
        categorySpending: totals.category_spending
      },
      error: null
    };

  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to calculate preview'
    };
  }
}
