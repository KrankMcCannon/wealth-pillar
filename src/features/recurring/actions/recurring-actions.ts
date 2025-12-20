"use server";

/**
 * Recurring Series Server Actions
 * 
 * Server-side actions for creating, updating, and deleting recurring transaction series.
 * These actions handle data mutations and cache invalidation.
 */

import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from "@/lib/cache";
import { supabaseServer } from "@/lib/database/server";
import { UserService } from '@/lib/services';
import { canAccessUserData, isMember } from '@/lib/utils/permissions';
import type { RecurringTransactionSeries } from "@/lib/types";
import { DateTime, today as luxonToday, nowISO, toDateString } from "@/lib/utils/date-utils";
import { revalidateTag } from "next/cache";

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
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get current user
    const { data: currentUser, error: userError } = await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'Utente non trovato' };
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
    if (isMember(currentUser)) {
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
      if (!canAccessUserData(currentUser, userId)) {
        return {
          data: null,
          error: 'Non hai i permessi per accedere ai dati di uno o più utenti selezionati'
        };
      }
    }

    const { data, error } = await supabaseServer
      .from("recurring_transactions")
      .insert({
        description: input.description.trim(),
        amount: input.amount,
        type: input.type,
        category: input.category,
        frequency: input.frequency,
        user_ids: input.user_ids,
        account_id: input.account_id,
        start_date: input.start_date,
        end_date: input.end_date || null,
        due_day: input.due_day,
        is_active: true,
        total_executions: 0,
        transaction_ids: [],
      })
      .select()
      .single();

    if (error) {
      console.error("[createRecurringSeriesAction] Error:", error);
      return { data: null, error: error.message };
    }

    // Invalidate cache for all affected users
    revalidateTag(CACHE_TAGS.RECURRING_SERIES);
    for (const userId of input.user_ids) {
      revalidateTag(`user:${userId}:recurring`);
    }

    return { data: data as unknown as RecurringTransactionSeries, error: null };
  } catch (error) {
    console.error("[createRecurringSeriesAction] Unexpected error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Errore durante la creazione della serie",
    };
  }
}

/**
 * Build update data object from input
 */
function buildUpdateData(input: UpdateRecurringSeriesInput): Record<string, unknown> | null {
  const updateData: Record<string, unknown> = {
    updated_at: nowISO(),
  };

  // Validate amount if provided
  if (input.amount !== undefined && input.amount <= 0) {
    return null;
  }

  // Copy all defined fields
  const fieldsToCopy: (keyof UpdateRecurringSeriesInput)[] = [
    "description", "amount", "type", "category", "frequency",
    "account_id", "start_date", "end_date", "due_day", "is_active", "user_ids"
  ];

  for (const field of fieldsToCopy) {
    if (input[field] !== undefined) {
      updateData[field] = field === "description" && typeof input[field] === "string"
        ? input[field].trim()
        : input[field];
    }
  }

  return updateData;
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

    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get current user
    const { data: currentUser, error: userError } = await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'Utente non trovato' };
    }

    // Get old user_ids to invalidate cache for previous users
    const { data: oldSeries } = await supabaseServer
      .from("recurring_transactions")
      .select("user_ids")
      .eq("id", input.id)
      .single();

    if (!oldSeries) {
      return { data: null, error: "Serie ricorrente non trovata" };
    }

    // Permission validation: verify access to existing series
    // Members can only update series they are part of
    const hasAccess = isMember(currentUser)
      ? (oldSeries.user_ids as string[]).includes(currentUser.id)
      : (oldSeries.user_ids as string[]).some(userId => canAccessUserData(currentUser, userId));

    if (!hasAccess) {
      return {
        data: null,
        error: 'Non hai i permessi per modificare questa serie ricorrente'
      };
    }

    // If changing user_ids, validate permissions
    if (input.user_ids) {
      if (isMember(currentUser)) {
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
          if (!canAccessUserData(currentUser, userId)) {
            return {
              data: null,
              error: 'Non hai i permessi per uno o più utenti selezionati'
            };
          }
        }
      }
    }

    const updateData = buildUpdateData(input);
    if (!updateData) {
      return { data: null, error: "L'importo deve essere maggiore di zero" };
    }

    const { data, error } = await supabaseServer
      .from("recurring_transactions")
      .update(updateData)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("[updateRecurringSeriesAction] Error:", error);
      return { data: null, error: error.message };
    }

    // Invalidate cache for all affected users (old and new)
    revalidateTag(CACHE_TAGS.RECURRING_SERIES);
    revalidateTag(CACHE_TAGS.RECURRING(input.id));

    // Invalidate old users' caches
    if (oldSeries?.user_ids) {
      for (const userId of oldSeries.user_ids) {
        revalidateTag(`user:${userId}:recurring`);
      }
    }

    // Invalidate new users' caches (if user_ids changed)
    if (data?.user_ids) {
      for (const userId of data.user_ids) {
        revalidateTag(`user:${userId}:recurring`);
      }
    }

    return { data: data as unknown as RecurringTransactionSeries, error: null };
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

    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get current user
    const { data: currentUser, error: userError } = await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'Utente non trovato' };
    }

    // First get the series to know the user_ids for cache invalidation
    const { data: series, error: fetchError } = await supabaseServer
      .from("recurring_transactions")
      .select("user_ids")
      .eq("id", seriesId)
      .single();

    if (fetchError) {
      console.error("[deleteRecurringSeriesAction] Fetch error:", fetchError);
      return { data: null, error: "Serie non trovata" };
    }

    // Permission validation: verify access to series
    const hasAccess = isMember(currentUser)
      ? (series.user_ids as string[]).includes(currentUser.id)
      : (series.user_ids as string[]).some(userId => canAccessUserData(currentUser, userId));

    if (!hasAccess) {
      return {
        data: null,
        error: 'Non hai i permessi per eliminare questa serie ricorrente'
      };
    }

    const { error } = await supabaseServer
      .from("recurring_transactions")
      .delete()
      .eq("id", seriesId);

    if (error) {
      console.error("[deleteRecurringSeriesAction] Error:", error);
      return { data: null, error: error.message };
    }

    // Invalidate cache for all affected users
    revalidateTag(CACHE_TAGS.RECURRING_SERIES);
    revalidateTag(CACHE_TAGS.RECURRING(seriesId));
    if (series?.user_ids) {
      for (const userId of series.user_ids) {
        revalidateTag(`user:${userId}:recurring`);
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
 * @param seriesId - The ID of the series to execute
 * @param userId - The ID of the user executing the series
 * @returns The created transaction ID or error
 */
export async function executeRecurringSeriesAction(
  seriesId: string,
  userId?: string
): Promise<ActionResult<{ transactionId: string }>> {
  try {
    if (!seriesId) {
      return { data: null, error: "ID serie obbligatorio" };
    }

    // Get the series
    const { data: series, error: fetchError } = await supabaseServer
      .from("recurring_transactions")
      .select("*")
      .eq("id", seriesId)
      .single();

    if (fetchError || !series) {
      console.error("[executeRecurringSeriesAction] Fetch error:", fetchError);
      return { data: null, error: "Serie non trovata" };
    }

    if (!series.is_active) {
      return { data: null, error: "La serie non è attiva" };
    }

    // Use provided userId or first user in the series
    const executingUserId = userId || series.user_ids[0];

    // Get user's group_id
    const { data: user, error: userError } = await supabaseServer
      .from("users")
      .select("group_id")
      .eq("id", executingUserId)
      .single();

    if (userError || !user) {
      return { data: null, error: "Utente non trovato" };
    }

    // Calculate the actual transaction date based on due_day
    const today = luxonToday();
    const transactionDate = DateTime.local(today.year, today.month, series.due_day);
    // Use the later date between transactionDate and today (compare via milliseconds)
    const maxMillis = Math.max(transactionDate.toMillis(), today.toMillis());
    const dateToUse = DateTime.fromMillis(maxMillis);

    // TODO: Abilitare la creazione automatica della transazione quando richiesto
    // Per ora la funzione è disabilitata - la transazione deve essere creata manualmente
    // 
    // // Create the transaction
    // const { data: transaction, error: txError } = await supabaseServer
    //   .from("transactions")
    //   .insert({
    //     description: series.description,
    //     amount: series.amount,
    //     type: series.type,
    //     category: series.category,
    //     date: dateToUse.toISOString().split("T")[0],
    //     user_id: executingUserId,
    //     account_id: series.account_id,
    //     group_id: user.group_id,
    //     recurring_series_id: series.id,
    //     frequency: series.frequency,
    //   })
    //   .select("id")
    //   .single();
    //
    // if (txError || !transaction) {
    //   console.error("[executeRecurringSeriesAction] Transaction error:", txError);
    //   return { data: null, error: "Errore durante la creazione della transazione" };
    // }
    //
    // // For 'once' frequency, deactivate the series
    // if (series.frequency === "once") {
    //   await supabaseServer
    //     .from("recurring_transactions")
    //     .update({
    //       is_active: false,
    //       total_executions: series.total_executions + 1,
    //       transaction_ids: [...(series.transaction_ids || []), transaction.id],
    //       updated_at: new Date().toISOString(),
    //     })
    //     .eq("id", seriesId);
    //
    //   revalidateTag(CACHE_TAGS.RECURRING_SERIES);
    //   revalidateTag(CACHE_TAGS.TRANSACTIONS);
    //   return { data: { transactionId: transaction.id }, error: null };
    // }
    //
    // // Check if end_date has been reached (for non-once frequencies)
    // const shouldDeactivate = series.end_date && today > new Date(series.end_date);
    //
    // // Update the series (due_day stays the same, just update execution count)
    // await supabaseServer
    //   .from("recurring_transactions")
    //   .update({
    //     is_active: !shouldDeactivate,
    //     total_executions: series.total_executions + 1,
    //     transaction_ids: [...(series.transaction_ids || []), transaction.id],
    //     updated_at: new Date().toISOString(),
    //   })
    //   .eq("id", seriesId);
    //
    // // Invalidate caches
    // revalidateTag(CACHE_TAGS.RECURRING_SERIES);
    // revalidateTag(CACHE_TAGS.RECURRING(seriesId));
    // revalidateTag(CACHE_TAGS.TRANSACTIONS);
    // revalidateTag(`user:${series.user_id}:transactions`);
    //
    // return { data: { transactionId: transaction.id }, error: null };

    // Per ora ritorniamo un messaggio informativo
    // La variabile dateToUse è calcolata ma non usata per ora (sarà usata quando la funzione sarà riabilitata)
    console.log(`[executeRecurringSeriesAction] Data addebito calcolata: ${toDateString(dateToUse)}`);
    return { data: null, error: "Funzione temporaneamente disabilitata. La creazione automatica delle transazioni sarà abilitata in seguito." };
  } catch (error) {
    console.error("[executeRecurringSeriesAction] Unexpected error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Errore durante l'esecuzione della serie",
    };
  }
}
