'use server';

/**
 * Recurring Series Server Actions
 *
 * Server-side actions for creating, updating, and deleting recurring transaction series.
 * These actions handle data mutations and cache invalidation.
 */

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from "@/lib/cache/config";
import { canAccessUserData, isMember } from '@/lib/utils/permissions';
import type { RecurringTransactionSeries, User } from "@/lib/types";
import { nowISO, toDateString } from "@/lib/utils/date-utils";
import { RecurringRepository } from '@/server/dal/recurring.repository';
import { serialize } from '@/lib/utils/serializer';

/**
 * Input type for creating a recurring series
 */
export interface CreateRecurringSeriesInput {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  frequency: "once" | "weekly" | "biweekly" | "monthly" | "yearly";
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
  type?: "income" | "expense";
  category?: string;
  frequency?: "once" | "weekly" | "biweekly" | "monthly" | "yearly";
  user_ids?: string[]; // Array of user IDs who can access this series
  account_id?: string;
  start_date?: string;
  end_date?: string | null;
  due_day?: number; // Giorno del mese per l'addebito (1-31)
  is_active?: boolean;
}

/**
 * Action result type
 */
interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
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
): Promise<ActionResult<RecurringTransactionSeries>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Validate required fields
    if (!input.description || input.description.trim() === "") {
      return { data: null, error: "La descrizione è obbligatoria" };
    }
    if (input.amount <= 0) {
      return { data: null, error: "L'importo deve essere maggiore di zero" };
    }
    if (!input.user_ids || input.user_ids.length === 0) {
      return { data: null, error: "Almeno un utente è obbligatorio" };
    }
    if (!input.account_id) {
      return { data: null, error: "Il conto è obbligatorio" };
    }
    if (!input.category) {
      return { data: null, error: "La categoria è obbligatoria" };
    }
    if (!input.due_day || input.due_day < 1 || input.due_day > 31) {
      return { data: null, error: "Il giorno di addebito deve essere tra 1 e 31" };
    }

    // Permission validation: members can only create series that include themselves
    if (isMember(currentUser as unknown as User)) {
      if (!input.user_ids.includes(currentUser.id)) {
        return {
          data: null,
          error: 'Devi includere te stesso nella serie ricorrente'
        };
      }

      // Members can only create series with themselves (not with other users)
      if (input.user_ids.length > 1 || input.user_ids[0] !== currentUser.id) {
        return {
          data: null,
          error: 'Non hai i permessi per creare serie ricorrenti per altri utenti'
        };
      }
    }

    // Admins can create for anyone, but verify all target users exist and are accessible
    for (const userId of input.user_ids) {
      if (!canAccessUserData(currentUser as unknown as User, userId)) {
        return {
          data: null,
          error: 'Non hai i permessi per accedere ai dati di uno o più utenti selezionati'
        };
      }
    }

    const data = await RecurringRepository.create({
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
      transaction_ids: [],
    });

    if (!data) {
      return { data: null, error: "Failed to create recurring series" };
    }

    // Invalidate cache for all affected users
    revalidateTag(CACHE_TAGS.RECURRING_SERIES, 'max');
    for (const userId of input.user_ids) {
      revalidateTag(`user:${userId}:recurring`, 'max');
    }

    return { data: serialize(data) as unknown as RecurringTransactionSeries, error: null };
  } catch (error) {
    console.error("[createRecurringSeriesAction] Unexpected error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Errore durante la creazione della serie",
    };
  }
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
): Promise<ActionResult<RecurringTransactionSeries>> {
  try {
    if (!input.id) {
      return { data: null, error: "ID serie obbligatorio" };
    }

    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get old user_ids to invalidate cache for previous users
    const oldSeries = await RecurringRepository.getById(input.id);

    if (!oldSeries) {
      return { data: null, error: "Serie ricorrente non trovata" };
    }

    // Permission validation: verify access to existing series
    // Members can only update series they are part of
    const hasAccess = isMember(currentUser as unknown as User)
      ? oldSeries.user_ids.includes(currentUser.id)
      : oldSeries.user_ids.some((userId: string) => canAccessUserData(currentUser as unknown as User, userId));

    if (!hasAccess) {
      return {
        data: null,
        error: 'Non hai i permessi per modificare questa serie ricorrente'
      };
    }

    // If changing user_ids, validate permissions
    if (input.user_ids) {
      if (isMember(currentUser as unknown as User)) {
        // Members can only have themselves in the series
        if (input.user_ids.length > 1 || input.user_ids[0] !== currentUser.id) {
          return {
            data: null,
            error: 'Non puoi assegnare la serie ricorrente ad altri utenti'
          };
        }
      } else {
        // Admins can assign to anyone they have access to
        for (const userId of input.user_ids) {
          if (!canAccessUserData(currentUser as unknown as User, userId)) {
            return {
              data: null,
              error: 'Non hai i permessi per uno o più utenti selezionati'
            };
          }
        }
      }
    }

    // Build update data
    const updatePayload: Record<string, any> = {};
    if (input.description !== undefined) updatePayload.description = input.description.trim();
    if (input.amount !== undefined) {
      if (input.amount <= 0) return { data: null, error: "L'importo deve essere maggiore di zero" };
      updatePayload.amount = input.amount;
    }
    if (input.type !== undefined) updatePayload.type = input.type;
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.frequency !== undefined) updatePayload.frequency = input.frequency;
    if (input.account_id !== undefined) updatePayload.account_id = input.account_id;
    if (input.start_date !== undefined) updatePayload.start_date = new Date(input.start_date).toISOString();
    if (input.end_date !== undefined) updatePayload.end_date = input.end_date ? new Date(input.end_date).toISOString() : null;
    if (input.due_day !== undefined) updatePayload.due_day = input.due_day;
    if (input.is_active !== undefined) updatePayload.is_active = input.is_active;
    if (input.user_ids !== undefined) updatePayload.user_ids = input.user_ids;

    updatePayload.updated_at = new Date();

    const data = await RecurringRepository.update(input.id, updatePayload);

    if (!data) {
      return { data: null, error: "Failed to update series" };
    }

    // Invalidate cache for all affected users (old and new)
    revalidateTag(CACHE_TAGS.RECURRING_SERIES, 'max');
    revalidateTag(CACHE_TAGS.RECURRING(input.id), 'max');

    // Invalidate old users' caches
    if (oldSeries.user_ids) {
      for (const userId of oldSeries.user_ids) {
        revalidateTag(`user:${userId}:recurring`, 'max');
      }
    }

    // Invalidate new users' caches (if user_ids changed)
    if (data.user_ids) {
      for (const userId of data.user_ids) {
        revalidateTag(`user:${userId}:recurring`, 'max');
      }
    }

    return { data: serialize(data) as unknown as RecurringTransactionSeries, error: null };
  } catch (error) {
    console.error("[updateRecurringSeriesAction] Unexpected error:", error);
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
): Promise<ActionResult<{ success: boolean }>> {
  try {
    if (!seriesId) {
      return { data: null, error: "ID serie obbligatorio" };
    }

    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // First get the series
    const series = await RecurringRepository.getById(seriesId);

    if (!series) {
      return { data: null, error: "Serie non trovata" };
    }

    // Permission validation: verify access to series
    const hasAccess = isMember(currentUser as unknown as User)
      ? series.user_ids.includes(currentUser.id)
      : series.user_ids.some((userId: string) => canAccessUserData(currentUser as unknown as User, userId));

    if (!hasAccess) {
      return {
        data: null,
        error: 'Non hai i permessi per eliminare questa serie ricorrente'
      };
    }

    const result = await RecurringRepository.delete(seriesId);

    if (!result) {
      return { data: null, error: "Failed to delete series" };
    }

    // Invalidate cache for all affected users
    revalidateTag(CACHE_TAGS.RECURRING_SERIES, 'max');
    revalidateTag(CACHE_TAGS.RECURRING(seriesId), 'max');
    if (series.user_ids) {
      for (const userId of series.user_ids) {
        revalidateTag(`user:${userId}:recurring`, 'max');
      }
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("[deleteRecurringSeriesAction] Unexpected error:", error);
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
): Promise<ActionResult<RecurringTransactionSeries>> {
  return updateRecurringSeriesAction({ id: seriesId, is_active: isActive });
}

/**
 * Execute a recurring series - create a transaction from it
 * This increments total_executions and updates due_day.
 *
 * @param _seriesId - The ID of the series to execute
 * @param _userId - The ID of the user executing the series
 * @returns The created transaction ID or error
 */
export async function executeRecurringSeriesAction(
  _seriesId: string,
  _userId?: string
): Promise<ActionResult<{ transactionId: string }>> {
  // const today = new Date();
  // Per ora ritorniamo un messaggio informativo
  // Logs for debug purposes (simulated usage to avoid lints)
  console.log(`[executeRecurringSeriesAction] Call attempt at: ${toDateString(nowISO())} for series ${_seriesId} by user ${_userId}`);

  return { data: null, error: "Funzione temporaneamente disabilitata. La creazione automatica delle transazioni sarà abilitata in seguito." };
}
