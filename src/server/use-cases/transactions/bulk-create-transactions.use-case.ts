import { db } from '@/server/db/drizzle';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import type { CommitImportRowInput, BulkImportResult } from '@/lib/import/types';
import { computeBalanceDeltas } from '@/server/use-cases/transactions/transaction-balance-delta.core';
import { applyBalanceDeltas } from './transaction-balance';
import { invalidateTransactionCaches } from '@/lib/utils/cache-utils';

const BULK_CHUNK_SIZE = 500;

function toInsertRow(row: CommitImportRowInput) {
  return {
    description: row.description.trim(),
    // Invariant: stored amount is always positive; sign/direction comes from `type` (see computeBalanceDeltas).
    amount: Math.abs(row.amount).toFixed(2),
    type: row.type,
    category: row.category,
    date: row.date,
    user_id: row.user_id,
    account_id: row.account_id,
    to_account_id: null,
    frequency: 'once' as const,
    group_id: row.group_id,
    import_hash: row.import_hash,
    ...(row.recurring_series_id ? { recurring_series_id: row.recurring_series_id } : {}),
  };
}

export async function bulkCreateTransactionsUseCase(
  rows: CommitImportRowInput[]
): Promise<BulkImportResult> {
  if (rows.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  const groupId = rows[0]!.group_id;
  const affectedAccounts = new Set<string>();
  // Stable insertion order also prevents competing unique import hashes from
  // acquiring their index locks in opposite orders, including across chunks.
  const orderedRows = [...rows].sort(
    (a, b) => a.account_id.localeCompare(b.account_id) || a.import_hash.localeCompare(b.import_hash)
  );

  let insertedCount = 0;

  await db.transaction(async (tx) => {
    const deltaTotals = new Map<string, number>();
    for (let index = 0; index < orderedRows.length; index += BULK_CHUNK_SIZE) {
      const chunk = orderedRows.slice(index, index + BULK_CHUNK_SIZE).map(toInsertRow);
      const inserted = await TransactionsRepository.createMany(chunk, tx);
      insertedCount += inserted.length;

      for (const transaction of inserted) {
        affectedAccounts.add(transaction.account_id);

        const rowDeltas = computeBalanceDeltas(transaction, 1);
        for (const [accountId, delta] of rowDeltas) {
          deltaTotals.set(accountId, (deltaTotals.get(accountId) ?? 0) + delta);
        }
      }
    }
    // Acquire account locks once for the entire import, in the same order as
    // ordinary ledger mutations. Sorting each chunk separately is insufficient.
    await applyBalanceDeltas(deltaTotals, tx);
  });

  for (const accountId of affectedAccounts) {
    invalidateTransactionCaches({
      groupId,
      accountId,
      userId: null,
      toAccountId: null,
    });
  }

  return {
    inserted: insertedCount,
    skipped: rows.length - insertedCount,
  };
}
