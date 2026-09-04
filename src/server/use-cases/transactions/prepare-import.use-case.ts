import Fuse from 'fuse.js';
import {
  DEFAULT_IMPORT_CATEGORY,
  isLikelyInternalTransfer,
  normalizeImportDescription,
  suggestCategoryFromImportRow,
} from '@/lib/import';
import type { PrepareImportRowInput, PrepareImportRowResult } from '@/lib/import/types';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { RecurringRepository } from '@/server/repositories/recurring.repository';

export type PrepareImportInput = {
  groupId: string;
  rows: PrepareImportRowInput[];
};

function dateRangeFromRows(rows: PrepareImportRowInput[]): { start: string; end: string } | null {
  if (rows.length === 0) return null;
  const dates = rows.map((row) => row.date).sort();
  return { start: dates[0]!, end: dates[dates.length - 1]! };
}

function amountsEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.01;
}

function findRecurringMatch(
  row: PrepareImportRowInput,
  seriesList: Array<{
    id: string;
    description: string;
    amount: string | number;
    type: string;
    due_day: number | null;
  }>
): { id: string; description: string } | null {
  const dayOfMonth = Number.parseInt(row.date.slice(8, 10), 10);
  const candidates = seriesList.filter((series) => {
    const seriesAmount = Number(series.amount);
    if (!amountsEqual(seriesAmount, row.amount)) return false;
    if (series.type !== row.type) return false;
    const dueDay = series.due_day ?? 1;
    return Math.abs(dueDay - dayOfMonth) <= 3;
  });

  if (candidates.length === 0) return null;

  const fuse = new Fuse(candidates, {
    keys: ['description'],
    threshold: 0.4,
    ignoreLocation: true,
  });

  const match = fuse.search(row.description)[0]?.item;
  if (!match) return null;
  return { id: match.id, description: match.description };
}

function findCategoryFromHistory(
  row: PrepareImportRowInput,
  history: Array<{ description: string; category: string }>
): string | null {
  const normalized = normalizeImportDescription(row.description);
  const exact = history.find((item) => normalizeImportDescription(item.description) === normalized);
  if (exact) return exact.category;

  const fuse = new Fuse(history, {
    keys: ['description'],
    threshold: 0.35,
    ignoreLocation: true,
  });
  return fuse.search(row.description)[0]?.item.category ?? null;
}

export async function prepareImportUseCase(
  input: PrepareImportInput
): Promise<PrepareImportRowResult[]> {
  const rowsByAccount = new Map<string, PrepareImportRowInput[]>();
  for (const row of input.rows) {
    const bucket = rowsByAccount.get(row.account_id) ?? [];
    bucket.push(row);
    rowsByAccount.set(row.account_id, bucket);
  }

  const results: PrepareImportRowResult[] = [];

  for (const [accountId, accountRows] of rowsByAccount) {
    const range = dateRangeFromRows(accountRows);
    if (!range) continue;

    const hashes = accountRows.map((row) => row.import_hash);
    const [existingHashes, manualDuplicates, accountHistory, recurringSeries] = await Promise.all([
      TransactionsRepository.findImportHashesForAccount(accountId, hashes),
      TransactionsRepository.findManualDuplicatesForAccount(accountId, range.start, range.end),
      TransactionsRepository.findByAccountDateRange(accountId, range.start, range.end),
      RecurringRepository.findActiveByAccount(accountId),
    ]);

    const hashSet = new Set(existingHashes);
    const historyCategories = accountHistory.map((item) => ({
      description: item.description,
      category: item.category,
    }));

    for (const row of accountRows) {
      let status: PrepareImportRowResult['status'] = 'new';
      let includeByDefault = true;

      if (hashSet.has(row.import_hash)) {
        status = 'duplicate';
        includeByDefault = false;
      } else {
        const manualMatch = manualDuplicates.find(
          (item) =>
            item.date === row.date &&
            item.type === row.type &&
            amountsEqual(Number(item.amount), row.amount) &&
            normalizeImportDescription(item.description) ===
              normalizeImportDescription(row.description)
        );
        if (manualMatch) {
          status = 'possible-duplicate';
          includeByDefault = false;
        }
      }

      const fromHistory = findCategoryFromHistory(row, historyCategories);
      const suggestedCategory =
        fromHistory ??
        suggestCategoryFromImportRow({
          description: row.description,
          type: row.type,
          ...(row.causale ? { causale: row.causale } : {}),
        });

      const recurringMatch = findRecurringMatch(row, recurringSeries);
      const likelyInternalTransfer = isLikelyInternalTransfer(row.description);

      results.push({
        ...row,
        status,
        suggestedCategory: suggestedCategory || DEFAULT_IMPORT_CATEGORY,
        ...(recurringMatch
          ? {
              suggestedRecurringSeriesId: recurringMatch.id,
              suggestedRecurringSeriesDescription: recurringMatch.description,
            }
          : {}),
        likelyInternalTransfer,
        includeByDefault,
      });
    }
  }

  return results.sort(
    (a, b) => b.date.localeCompare(a.date) || a.description.localeCompare(b.description)
  );
}
