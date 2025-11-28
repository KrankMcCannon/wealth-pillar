'use server';

import { TransactionService, CreateTransactionInput } from '@/lib/services/transaction.service';
import type { Transaction } from '@/lib/types';
import type { ServiceResult } from '@/lib/services/user.service';

/**
 * Server Action: Create Transaction
 * Wraps TransactionService.createTransaction for client component usage
 */
export async function createTransactionAction(
  input: CreateTransactionInput
): Promise<ServiceResult<Transaction>> {
  try {
    return await TransactionService.createTransaction(input);
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
 */
export async function updateTransactionAction(
  id: string,
  input: Partial<CreateTransactionInput>
): Promise<ServiceResult<Transaction>> {
  try {
    return await TransactionService.updateTransaction(id, input);
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
 */
export async function deleteTransactionAction(
  id: string
): Promise<ServiceResult<{ id: string }>> {
  try {
    return await TransactionService.deleteTransaction(id);
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete transaction',
    };
  }
}
