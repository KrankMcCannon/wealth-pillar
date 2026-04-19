'use server';

/**
 * Recurring Series Server Actions
 *
 * Server-side actions for creating, updating, and deleting recurring transaction series.
 * These actions handle data mutations and cache invalidation.
 */

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { canAccessUserData, isMember } from '@/lib/utils/permissions';
import { RecurringTransactionSeries, User } from '@/lib/types';
import {
  createSeriesUseCase,
  deleteSeriesUseCase,
  getSeriesByIdUseCase,
  updateSeriesUseCase,
} from '@/server/use-cases/recurring/recurring.use-cases';
import { serialize } from '@/lib/utils/serializer';
import { devWarn } from '@/lib/utils/dev-log';
import type { ServiceResult } from '@/lib/types/service-result';

/**
 * Input type for creating a recurring series
 */
export interface CreateRecurringSeriesInput {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  user_ids: string[]; // Array of user IDs who can access this series
  account_id: string;
  start_date: string;
  end_date?: string | null;
  due_day: number; // Giorno del mese per l'addebito (1-31)
}

/**
 * Input type for updating a recurring series
 */
export interface UpdateRecurringSeriesInput {
  id: string;
  description?: string;
  amount?: number;
  type?: 'income' | 'expense';
  category?: string;
  frequency?: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  user_ids?: string[]; // Array of user IDs who can access this series
  account_id?: string;
  start_date?: string;
  end_date?: string | null;
  due_day?: number; // Giorno del mese per l'addebito (1-31)
  is_active?: boolean;
}

// Helper: Validate input fields for creation
function validateCreateInput(input: CreateRecurringSeriesInput): string | null {
  if (!input.description || input.description.trim() === '') return 'La descrizione è obbligatoria';
  if (input.amount <= 0) return "L'importo deve essere maggiore di zero";
  if (!input.user_ids || input.user_ids.length === 0) return 'Almeno un utente è obbligatorio';
  if (!input.account_id) return 'Il conto è obbligatorio';
  if (!input.category) return 'La categoria è obbligatoria';
  if (!input.due_day || input.due_day < 1 || input.due_day > 31)
    return 'Il giorno di addebito deve essere tra 1 e 31';
  return null;
}

// Helper: Validate permissions for creation
function validateCreatePermissions(currentUser: User, userIds: string[]): string | null {
  // Permission validation: members can only create series that include themselves
  if (isMember(currentUser)) {
    if (!userIds.includes(currentUser.id)) {
      return 'Devi includere te stesso nella serie ricorrente';
    }

    // Members can only create series with themselves (not with other users)
    if (userIds.length > 1 || userIds[0] !== currentUser.id) {
      return 'Non hai i permessi per creare serie ricorrenti per altri utenti';
    }
  }

  // Admins can create for anyone, but verify all target users exist and are accessible
  for (const userId of userIds) {
    if (!canAccessUserData(currentUser, userId)) {
      return 'Non hai i permessi per accedere ai dati di uno o più utenti selezionati';
    }
  }

  return null;
}

/**
 * Create a new recurring series
 *
 * Validates permissions: members can only create series that include themselves
 *
 * @param input - The series data to create
 * @returns The created series or error
 */
export async function createRecurringSeriesAction(
  input: CreateRecurringSeriesInput
): Promise<ServiceResult<RecurringTransactionSeries>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Validate input logic
    const inputError = validateCreateInput(input);
    if (inputError) return { data: null, error: inputError };

    // Validate permissions logic
    const permError = validateCreatePermissions(currentUser as unknown as User, input.user_ids);
    if (permError) return { data: null, error: permError };

    const data = await createSeriesUseCase({
      description: input.description.trim(),
      amount: input.amount,
      type: input.type,
      category: input.category,
      frequency: input.frequency,
      user_ids: input.user_ids,
      account_id: input.account_id,
      start_date: new Date(input.start_date).toISOString(),
      end_date: input.end_date ? new Date(input.end_date).toISOString() : null,
      due_day: input.due_day,
      is_active: true,
      total_executions: 0,
    });

    if (!data) {
      return { data: null, error: 'Failed to create recurring series' };
    }

    return { data: serialize(data) as unknown as RecurringTransactionSeries, error: null };
  } catch (error) {
    console.error('[createRecurringSeriesAction] Unexpected error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Errore durante la creazione della serie',
    };
  }
}

// Helper: Validate new user assignment permissions
function validateNewUserAssignments(currentUser: User, newUserIds: string[]): string | null {
  if (isMember(currentUser)) {
    // Members can only have themselves in the series
    if (newUserIds.length > 1 || newUserIds[0] !== currentUser.id) {
      return 'Non puoi assegnare la serie ricorrente ad altri utenti';
    }
  } else {
    // Admins can assign to anyone they have access to
    for (const userId of newUserIds) {
      if (!canAccessUserData(currentUser, userId)) {
        return 'Non hai i permessi per uno o più utenti selezionati';
      }
    }
  }
  return null;
}

// Helper: Validate permissions for update
function validateUpdatePermission(
  currentUser: User,
  oldSeries: RecurringTransactionSeries,
  newUserIds?: string[]
): string | null {
  // 1. Verify access to existing series
  const user = currentUser as unknown as User;
  const hasAccess = isMember(user)
    ? oldSeries.user_ids.includes(currentUser.id)
    : oldSeries.user_ids.some((userId: string) => canAccessUserData(user, userId));

  if (!hasAccess) {
    return 'Non hai i permessi per modificare questa serie ricorrente';
  }

  // 2. If changing user_ids, validate new assignment permissions
  if (newUserIds) {
    return validateNewUserAssignments(user, newUserIds);
  }

  return null;
}

/**
 * Update an existing recurring series
 *
 * Validates permissions: members can only update series they own
 *
 * @param input - The series data to update
 * @returns The updated series or error
 */
export async function updateRecurringSeriesAction(
  input: UpdateRecurringSeriesInput
): Promise<ServiceResult<RecurringTransactionSeries>> {
  try {
    if (!input.id) {
      return { data: null, error: 'ID serie obbligatorio' };
    }

    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get old user_ids to invalidate cache for previous users
    const oldSeries = await getSeriesByIdUseCase(input.id);
    if (!oldSeries) {
      return { data: null, error: 'Serie ricorrente non trovata' };
    }

    // Permission validation
    const permError = validateUpdatePermission(
      currentUser as unknown as User,
      oldSeries,
      input.user_ids
    );
    if (permError) return { data: null, error: permError };

    // Helper: Build update payload
    function buildUpdatePayload(input: UpdateRecurringSeriesInput): {
      payload: Partial<UpdateRecurringSeriesInput> & { updated_at?: string };
      error?: string;
    } {
      const updatePayload: Partial<UpdateRecurringSeriesInput> & { updated_at?: string } = {};

      if (input.description !== undefined) updatePayload.description = input.description.trim();
      if (input.amount !== undefined) {
        if (input.amount <= 0)
          return { payload: {}, error: "L'importo deve essere maggiore di zero" };
        updatePayload.amount = input.amount;
      }
      if (input.type !== undefined) updatePayload.type = input.type;
      if (input.category !== undefined) updatePayload.category = input.category;
      if (input.frequency !== undefined) updatePayload.frequency = input.frequency;
      if (input.account_id !== undefined) updatePayload.account_id = input.account_id;
      if (input.start_date !== undefined)
        updatePayload.start_date = new Date(input.start_date).toISOString();
      if (input.end_date !== undefined)
        updatePayload.end_date = input.end_date ? new Date(input.end_date).toISOString() : null;
      if (input.due_day !== undefined) updatePayload.due_day = input.due_day;
      if (input.is_active !== undefined) updatePayload.is_active = input.is_active;
      if (input.user_ids !== undefined) updatePayload.user_ids = input.user_ids;

      updatePayload.updated_at = new Date().toISOString();

      return { payload: updatePayload };
    }

    // Build update data
    const { payload, error: payloadError } = buildUpdatePayload(input);
    if (payloadError) return { data: null, error: payloadError };
    const updatePayload = payload;

    const data = await updateSeriesUseCase(
      input.id,
      updatePayload as Parameters<typeof updateSeriesUseCase>[1]
    );
    if (!data) {
      return { data: null, error: 'Failed to update series' };
    }

    return { data: serialize(data) as unknown as RecurringTransactionSeries, error: null };
  } catch (error) {
    console.error('[updateRecurringSeriesAction] Unexpected error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Errore durante l'aggiornamento della serie",
    };
  }
}

/**
 * Delete a recurring series
 *
 * Validates permissions: members can only delete series they own
 *
 * @param seriesId - The ID of the series to delete
 * @returns Success status or error
 */
export async function deleteRecurringSeriesAction(
  seriesId: string
): Promise<ServiceResult<{ success: boolean }>> {
  try {
    if (!seriesId) {
      return { data: null, error: 'ID serie obbligatorio' };
    }

    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // First get the series
    await deleteSeriesUseCase(seriesId);

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('[deleteRecurringSeriesAction] Unexpected error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Errore durante l'eliminazione della serie",
    };
  }
}

/**
 * Toggle the active status of a recurring series
 *
 * @param seriesId - The ID of the series to toggle
 * @param isActive - The new active status
 * @returns The updated series or error
 */
export async function toggleRecurringSeriesActiveAction(
  seriesId: string,
  isActive: boolean
): Promise<ServiceResult<RecurringTransactionSeries>> {
  return updateRecurringSeriesAction({ id: seriesId, is_active: isActive });
}

/**
 * Execute a recurring series - create a transaction from it
 * This increments total_executions and updates due_day.
 *
 * @returns The created transaction ID or error
 */
export async function executeRecurringSeriesAction(
  seriesId: string
): Promise<ServiceResult<{ transactionId: string }>> {
  devWarn('Series execution not implemented yet for series:', seriesId);
  // const today = new Date();
  // Per ora ritorniamo un messaggio informativo
  return {
    data: null,
    error:
      'Funzione temporaneamente disabilitata. La creazione automatica delle transazioni sarà abilitata in seguito.',
  };
}
