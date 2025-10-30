/**
 * Transaction Form Logic
 * Extracts domain-specific business logic from the form controller
 *
 * Handles:
 * - Default account selection when user changes
 * - Transfer-specific validations
 * - Cross-field validation rules
 */

'use client';

import { type User } from '@/lib/types';

/**
 * Account interface for type safety
 */
interface Account {
  id: string;
  name: string;
  user_ids?: string[];
}

/**
 * Determine if an account belongs to a user
 * Accounts may have user_ids array indicating which users have access
 */
export function accountBelongsToUser(account: Account | undefined, userId: string): boolean {
  if (!account || !userId || userId === 'all') return false;
  if (!account.user_ids) return true; // If no user_ids array, account is shared
  return account.user_ids.includes(userId);
}

/**
 * Get the default account ID for a user
 * Falls back to empty string if no default or user not found
 */
export function getDefaultAccountForUser(user: User | undefined): string {
  return user?.default_account_id || '';
}

/**
 * Handle user change logic - auto-select appropriate account
 *
 * When a user is changed:
 * 1. Check if current account belongs to new user
 * 2. If not, use user's default account
 * 3. Clear transfer destination if switching users
 */
export function handleUserChange(
  newUserId: string,
  currentFormState: {
    account_id: string;
    to_account_id?: string;
  },
  users: User[],
  accounts: Account[]
): Partial<{
  account_id: string;
  to_account_id: string;
}> {
  // User not changing or changing to "all"
  if (!newUserId || newUserId === 'all') {
    return {};
  }

  const selectedUser = users.find((u) => u.id === newUserId);
  const currentAccount = accounts.find((a) => a.id === currentFormState.account_id);
  const accountBelongs = accountBelongsToUser(currentAccount, newUserId);

  const updates: Partial<{
    account_id: string;
    to_account_id: string;
  }> = {};

  // If current account doesn't belong to new user, switch to default
  if (!accountBelongs) {
    updates.account_id = getDefaultAccountForUser(selectedUser);
    // Clear transfer destination when switching users
    updates.to_account_id = '';
  }

  return updates;
}

/**
 * Validate transfer transaction requirements
 * For transfer type:
 * - to_account_id must be provided
 * - source and destination must be different
 */
export function validateTransferAccounts(
  type: string,
  accountId: string,
  toAccountId: string | undefined
): string | null {
  // Only validate if it's a transfer type
  if (type !== 'transfer') {
    return null;
  }

  // Transfer requires destination account
  if (!toAccountId) {
    return 'Seleziona il conto di destinazione';
  }

  // Source and destination must be different
  if (accountId && accountId === toAccountId) {
    return 'Il conto origine e destinazione devono essere diversi';
  }

  return null;
}

/**
 * Get valid destination accounts for a transfer
 * Excludes the source account
 */
export function getValidTransferDestinations(
  sourceAccountId: string,
  allAccounts: Account[]
): Account[] {
  return allAccounts.filter((account) => account.id !== sourceAccountId);
}

/**
 * Determine if category field should be visible
 * Hidden for transfer type transactions
 */
export function shouldShowCategoryField(transactionType: string): boolean {
  return transactionType !== 'transfer';
}

/**
 * Get the category value based on transaction type
 * For transfer transactions, automatically set to "trasferimento"
 * For other types, return the provided category value
 */
export function getCategoryForTransactionType(
  transactionType: string,
  currentCategory: string
): string {
  if (transactionType === 'transfer') {
    return 'trasferimento';
  }
  return currentCategory;
}

/**
 * Build account filter for a selected user
 * Returns accounts that the user has access to
 */
export function getAccountsForUser(userId: string, allAccounts: Account[]): Account[] {
  if (!userId || userId === 'all') {
    return allAccounts;
  }

  return allAccounts.filter((account) => accountBelongsToUser(account, userId));
}

/**
 * Format transaction payload with proper type conversions
 * Handles:
 * - Converting amount string to number
 * - Converting date string to ISO format
 * - Clearing transfer-specific fields for non-transfer types
 */
export function formatTransactionPayload(formData: {
  amount: string;
  date: string;
  type: string;
  to_account_id?: string;
}): {
  amount: number;
  date: string;
  to_account_id: string | null;
} {
  const amount = typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount;
  const date = new Date(formData.date).toISOString();
  const to_account_id = formData.type === 'transfer' ? (formData.to_account_id || null) : null;

  return {
    amount,
    date,
    to_account_id,
  };
}
