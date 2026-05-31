'use server';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { revalidateTransactionRelatedPaths } from '@/lib/cache/revalidation-paths';
import type { ServiceResult } from '@/lib/types/service-result';
import { assertCanActOnUser } from '@/features/permissions/assert-can-act-on-user';
import { createTransactionUseCase } from '@/server/use-cases/transactions/create-transaction.use-case';
import { updateTransactionUseCase } from '@/server/use-cases/transactions/update-transaction.use-case';
import { deleteTransactionUseCase } from '@/server/use-cases/transactions/delete-transaction.use-case';
import { getTransactionByIdUseCase } from '@/server/use-cases/transactions/get-transactions.use-case';
import type { CreateTransactionInput } from '@/server/use-cases/transactions/types';
import { canAccessUserData, isMember } from '@/lib/utils';
import type { User, Transaction } from '@/lib/types';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '@/lib/validation/transaction-schemas';
import {
  fetchTransactionsWindow,
  type TransactionsListQuery,
} from '@/server/use-cases/pages/transactions-page.use-case';
import { getSeriesByGroupUseCase } from '@/server/use-cases/recurring/recurring.use-cases';
import { getBudgetsByGroupUseCase } from '@/server/use-cases/budgets/get-budgets.use-case';
import type { RecurringTransactionSeries, Budget } from '@/lib/types';

/**
 * Server Action: Create Transaction
 * Wraps TransactionService.createTransaction for client component usage
 * Validates permissions: members can only create transactions for themselves
 */
export async function createTransactionAction(
  input: CreateTransactionInput
): Promise<ServiceResult<Transaction>> {
  try {
    const currentUser = await getCurrentUser();
    const gate = assertCanActOnUser(currentUser as unknown as User, input.user_id ?? undefined);
    if (!gate.ok) return { data: null, error: gate.error };

    const parsed = createTransactionSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const data = await createTransactionUseCase(parsed.data as CreateTransactionInput);

    if (data) {
      revalidateTransactionRelatedPaths();
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create transaction',
    };
  }
}

/**
 * Server Action: Update Transaction
 * Wraps TransactionService.updateTransaction for client component usage
 * Validates permissions: members can only update their own transactions
 */
export async function updateTransactionAction(
  id: string,
  input: Partial<CreateTransactionInput>
): Promise<ServiceResult<Transaction>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get existing transaction to verify ownership
    const existingTransaction = await getTransactionByIdUseCase(id);
    if (!existingTransaction) {
      return { data: null, error: 'Transazione non trovata' };
    }

    // Verify transaction has a user_id
    if (!existingTransaction.user_id) {
      return {
        data: null,
        error: 'La transazione non ha un utente assegnato',
      };
    }

    // Permission validation: verify access to existing transaction
    if (!canAccessUserData(currentUser as unknown as User, existingTransaction.user_id)) {
      return { data: null, error: 'Permesso negato' };
    }

    // If changing user_id, verify permission for new user
    if (input.user_id && input.user_id !== existingTransaction.user_id) {
      if (isMember(currentUser as unknown as User)) {
        return { data: null, error: 'Non puoi assegnare la transazione a un altro utente' };
      }
      if (!canAccessUserData(currentUser as unknown as User, input.user_id)) {
        return { data: null, error: 'Permesso negato' };
      }
    }

    const parsed = updateTransactionSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const data = await updateTransactionUseCase(id, parsed.data as Partial<CreateTransactionInput>);

    if (data) {
      revalidateTransactionRelatedPaths();
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update transaction',
    };
  }
}

/**
 * Server Action: Delete Transaction
 * Wraps TransactionService.deleteTransaction for client component usage
 * Validates permissions: members can only delete their own transactions
 */
export async function getTransactionByIdAction(id: string): Promise<ServiceResult<Transaction>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    const transaction = await getTransactionByIdUseCase(id);
    if (!transaction) {
      return { data: null, error: 'Transazione non trovata' };
    }

    if (
      transaction.user_id &&
      !canAccessUserData(currentUser as unknown as User, transaction.user_id)
    ) {
      return { data: null, error: 'Permesso negato' };
    }

    return { data: transaction, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to load transaction',
    };
  }
}

export type LoadMoreTransactionsInput = {
  query: TransactionsListQuery;
  cursor: string;
};

export async function loadMoreTransactionsAction(input: LoadMoreTransactionsInput): Promise<
  ServiceResult<{
    transactions: Transaction[];
    hasMore: boolean;
    nextCursor?: string;
  }>
> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    const groupId = currentUser.group_id?.trim();
    if (!groupId) {
      return { data: null, error: 'Gruppo non trovato' };
    }

    const scopedQuery: TransactionsListQuery = { ...input.query, cursor: input.cursor };
    if (isMember(currentUser as unknown as User)) {
      scopedQuery.user = currentUser.id;
    }

    const window = await fetchTransactionsWindow(
      groupId,
      scopedQuery,
      currentUser as unknown as User
    );

    return { data: window, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to load more transactions',
    };
  }
}

export async function loadRecurringTabAction(): Promise<
  ServiceResult<{
    recurringSeries: RecurringTransactionSeries[];
    budgets: Budget[];
  }>
> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    const groupId = currentUser.group_id?.trim();
    if (!groupId) {
      return { data: null, error: 'Gruppo non trovato' };
    }

    const [recurringSeries, budgets] = await Promise.all([
      getSeriesByGroupUseCase(groupId),
      getBudgetsByGroupUseCase(groupId),
    ]);

    return { data: { recurringSeries, budgets }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to load recurring data',
    };
  }
}

export async function deleteTransactionAction(id: string): Promise<ServiceResult<{ id: string }>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get existing transaction to verify ownership
    const existingTransaction = await getTransactionByIdUseCase(id);
    if (!existingTransaction) {
      return { data: null, error: 'Transazione non trovata' };
    }

    // Verify transaction has a user_id
    if (!existingTransaction.user_id) {
      return {
        data: null,
        error: 'La transazione non ha un utente assegnato',
      };
    }

    // Permission validation: verify access to transaction
    if (!canAccessUserData(currentUser as unknown as User, existingTransaction.user_id)) {
      return { data: null, error: 'Permesso negato' };
    }

    // Call service
    await deleteTransactionUseCase(id);

    revalidateTransactionRelatedPaths();

    return { data: { id }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete transaction',
    };
  }
}
