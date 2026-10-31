import type { PrepareImportRowResult } from '@/lib/import';
import type { PreviewRow } from '../components/import-modal/import-preview-row';
export const IMPORT_PREVIEW_PAGE_SIZE = 50;
export function restorePreviewChoices(
  rows: PreviewRow[],
  previous: PreviewRow[],
  categories: Set<string>
): PreviewRow[] {
  const old = new Map(previous.map((row) => [row.rowId, row]));
  return rows.map((row) => {
    const prior = old.get(row.rowId);
    const same =
      prior &&
      (['account_id', 'user_id', 'date', 'description', 'amount', 'type'] as const).every(
        (field) => prior[field] === row[field]
      );
    return same
      ? {
          ...row,
          include: canSelectImportRow(row) && prior.include,
          category: categories.has(prior.category) ? prior.category : row.category,
        }
      : row;
  });
}
export function canSelectImportRow(row: Pick<PrepareImportRowResult, 'status'>): boolean {
  return row.status === 'new' || row.status === 'possible-duplicate';
}
export function setPreviewSelection(
  rows: PreviewRow[],
  visibleIds: Set<string>,
  include: boolean
): PreviewRow[] {
  return rows.map((row) =>
    visibleIds.has(row.rowId) ? { ...row, include: include && canSelectImportRow(row) } : row
  );
}
export function summarizeImportSelection(rows: PreviewRow[]) {
  const accounts = new Map<
    string,
    { accountId: string; count: number; income: number; expense: number }
  >();
  for (const row of rows) {
    if (!row.include) continue;
    const summary = accounts.get(row.account_id) ?? {
      accountId: row.account_id,
      count: 0,
      income: 0,
      expense: 0,
    };
    summary.count++;
    const cents = Math.round(Math.abs(row.amount) * 100);
    if (row.type === 'income') summary.income += cents;
    else summary.expense += cents;
    accounts.set(row.account_id, summary);
  }
  return [...accounts.values()].map((item) => ({
    ...item,
    income: item.income / 100,
    expense: item.expense / 100,
  }));
}
