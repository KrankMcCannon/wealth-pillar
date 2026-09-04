'use server';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { assertCanActOnUser } from '@/features/permissions/assert-can-act-on-user';
import type { ServiceResult } from '@/lib/types/service-result';
import type { User } from '@/lib/types';
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
    import_hash: string;
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

    const data = await prepareImportUseCase({
      groupId: parsed.data.group_id,
      rows: parsed.data.rows.map((row) => {
        const base = {
          rowId: row.rowId,
          account_id: row.account_id,
          date: row.date,
          description: row.description,
          amount: row.amount,
          type: row.type,
          import_hash: row.import_hash,
        };
        return row.causale ? { ...base, causale: row.causale } : base;
      }),
    });

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

    for (const row of parsed.data.rows) {
      const gate = assertCanActOnUser(currentUser as unknown as User, row.user_id);
      if (!gate.ok) return { data: null, error: gate.error };
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
