'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { BudgetPeriodService, UserService } from '@/server/services';
import { canAccessUserData, isMember } from '@/lib/utils/permissions';
import type { BudgetPeriod, User } from '@/lib/types';
import type { ServiceResult } from '@/server/services/user.service';

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
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return {
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      };
    }

    // Get current user
    const { data: currentUser, error: userError } =
      await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'Utente non trovato' };
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

    if (!result.error) {
      // Revalidate pages that display budget periods
      revalidatePath('/budgets');
      revalidatePath('/dashboard');
      revalidatePath('/reports');
    }

    return result;
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
  periodId: string,
  endDate: string,
): Promise<ServiceResult<BudgetPeriod>> {
  try {
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return {
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      };
    }

    // Get current user
    const { data: currentUser, error: userError } =
      await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'Utente non trovato' };
    }

    // Get the period to verify ownership
    const { data: period, error: periodError } =
      await BudgetPeriodService.getPeriodById(periodId);
    if (periodError || !period) {
      return { data: null, error: periodError || 'Periodo non trovato' };
    }

    // Permission validation: members can only close their own periods
    if (isMember(currentUser as unknown as User) && period.user_id !== currentUser.id) {
      return {
        data: null,
        error: 'Non hai i permessi per chiudere questo periodo',
      };
    }

    // Admins can close for anyone
    if (!canAccessUserData(currentUser as unknown as User, period.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per accedere ai dati di questo utente',
      };
    }

    // Close period with calculations or pre-calculated totals
    const result = await BudgetPeriodService.closePeriod(
      periodId,
      endDate,
    );

    if (!result.error) {
      // Revalidate pages that display budget periods
      revalidatePath('/budgets');
      revalidatePath('/dashboard');
      revalidatePath('/reports');
    }

    return result;
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
  periodId: string
): Promise<ServiceResult<{ id: string }>> {
  try {
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return {
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      };
    }

    // Get current user
    const { data: currentUser, error: userError } =
      await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'Utente non trovato' };
    }

    // Get the period to verify ownership
    const { data: period, error: periodError } =
      await BudgetPeriodService.getPeriodById(periodId);
    if (periodError || !period) {
      return { data: null, error: periodError || 'Periodo non trovato' };
    }

    // Permission validation: members can only delete their own periods
    if (isMember(currentUser as unknown as User) && period.user_id !== currentUser.id) {
      return {
        data: null,
        error: 'Non hai i permessi per eliminare questo periodo',
      };
    }

    // Admins can delete for anyone
    if (!canAccessUserData(currentUser as unknown as User, period.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per accedere ai dati di questo utente',
      };
    }

    // Delete period
    const result = await BudgetPeriodService.deletePeriod(periodId);

    if (!result.error) {
      // Revalidate pages that display budget periods
      revalidatePath('/budgets');
      revalidatePath('/dashboard');
      revalidatePath('/reports');
    }

    return result;
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
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return {
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      };
    }

    // Get current user
    const { data: currentUser, error: userError } =
      await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'Utente non trovato' };
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
    const result = await BudgetPeriodService.getPeriodsByUser(userId);

    return result;
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
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return {
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      };
    }

    // Get current user
    const { data: currentUser, error: userError } =
      await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'Utente non trovato' };
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
    const result = await BudgetPeriodService.getActivePeriod(userId);

    return result;
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch active period',
    };
  }
}
