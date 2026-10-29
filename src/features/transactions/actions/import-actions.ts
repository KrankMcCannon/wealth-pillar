'use server';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import type { ServiceResult } from '@/lib/types/service-result';
import type { User } from '@/lib/types';
import { FinancialResourcePolicy } from '@/server/permissions/financial-resource-policy';
import {
  prepareImportRowProofs,
  verifyImportRowProof,
} from '@/server/use-cases/transactions/import-row-proof';
import type { BulkImportResult, PrepareImportRowResult } from '@/lib/import/types';
import { prepareImportUseCase } from '@/server/use-cases/transactions/prepare-import.use-case';
import { bulkCreateTransactionsUseCase } from '@/server/use-cases/transactions/bulk-create-transactions.use-case';
import { commitImportSchema, prepareImportSchema } from '@/lib/validation/transaction-schemas';

export async function prepareImportAction(input: {
  group_id: string;
  rows: Array<{
    rowId: string;
    account_id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    causale?: string;
  }>;
}): Promise<ServiceResult<PrepareImportRowResult[]>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.group_id) {
      return { data: null, error: 'Gruppo non trovato' };
    }

    const parsed = prepareImportSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    if (parsed.data.group_id !== currentUser.group_id) {
      return { data: null, error: 'Permesso negato' };
    }

    const policy = new FinancialResourcePolicy(currentUser as unknown as User);
    for (const accountId of new Set(parsed.data.rows.map((row) => row.account_id))) {
      await policy.assertAccount(accountId);
    }
    const rows = await prepareImportRowProofs(parsed.data.rows, {
      userId: currentUser.id,
      groupId: policy.groupId,
    });
    const data = await prepareImportUseCase({ groupId: policy.groupId, rows });

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to prepare import',
    };
  }
}

export async function commitImportAction(input: {
  group_id: string;
  rows: Array<{
    rowId: string;
    account_id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    import_hash: string;
    occurrence_index: number;
    preparation_token: string;
    category: string;
    user_id: string;
    recurring_series_id?: string;
  }>;
}): Promise<ServiceResult<BulkImportResult>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.group_id) {
      return { data: null, error: 'Gruppo non trovato' };
    }

    const parsed = commitImportSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    if (parsed.data.group_id !== currentUser.group_id) {
      return { data: null, error: 'Permesso negato' };
    }

    const policy = new FinancialResourcePolicy(currentUser as unknown as User);
    for (const row of parsed.data.rows) {
      await verifyImportRowProof(row, { userId: currentUser.id, groupId: policy.groupId });
    }
    await policy.assertUsers([...new Set(parsed.data.rows.map((row) => row.user_id))]);
    for (const accountId of new Set(parsed.data.rows.map((row) => row.account_id))) {
      await policy.assertAccount(accountId);
    }

    const data = await bulkCreateTransactionsUseCase(
      parsed.data.rows.map((row) => {
        const commitRow = {
          rowId: row.rowId,
          account_id: row.account_id,
          date: row.date,
          description: row.description,
          amount: row.amount,
          type: row.type,
          import_hash: row.import_hash,
          category: row.category,
          user_id: row.user_id,
          group_id: parsed.data.group_id,
        };
        return row.recurring_series_id
          ? { ...commitRow, recurring_series_id: row.recurring_series_id }
          : commitRow;
      })
    );

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to commit import',
    };
  }
}
